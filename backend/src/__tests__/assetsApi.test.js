/**
 * Assets API Unit Tests
 * 
 * This test file demonstrates API route testing with mocked database connections.
 * It validates route behavior and response contracts without requiring a live
 * PostgreSQL instance.
 * 
 * Note: This test uses Jest with ES modules and mocks the database module to
 * isolate route logic from external dependencies.
 */

import request from "supertest";
import { jest } from "@jest/globals";
import fs from "fs";
import path from "path";
import os from "os";

const mockQuery = jest.fn();
const testUploadDir = fs.mkdtempSync(path.join(os.tmpdir(), "vellum-upload-test-"));
process.env.UPLOAD_DIR = testUploadDir;

jest.unstable_mockModule("../config/database.js", () => ({
  query: mockQuery,
  testConnection: jest.fn(async () => true),
  default: {}
}));

const { app } = await import("../server.js");

describe("Assets API", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    mockQuery.mockReset();
  });

  afterEach(() => {
    if (!fs.existsSync(testUploadDir)) return;
    for (const entry of fs.readdirSync(testUploadDir)) {
      fs.unlinkSync(path.join(testUploadDir, entry));
    }
  });

  afterAll(() => {
    if (fs.existsSync(testUploadDir)) {
      fs.rmSync(testUploadDir, { recursive: true, force: true });
    }
    delete process.env.UPLOAD_DIR;
  });

  test("POST /api/assets returns 201 with asset id for valid payload", async () => {
    // Arrange: Mock full createAsset flow (status lookup, insert asset, insert version, getAssetById)
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Draft status lookup
      .mockResolvedValueOnce({
        rows: [{ id: 101, title: "Landing Page Banner", description: "Sprint 1 demo asset" }]
      }) // INSERT assets RETURNING id
      .mockResolvedValueOnce({ rows: [] }) // INSERT asset_versions
      .mockResolvedValueOnce({
        rows: [
          {
            id: 101,
            title: "Landing Page Banner",
            description: "Sprint 1 demo asset",
            status: "Draft",
            current_version: "v1.0",
            owner: "Unassigned",
            created_at: "2026-02-17T00:00:00.000Z",
            updated_at: "2026-02-17T00:00:00.000Z"
          }
        ]
      }); // getAssetById SELECT

    // Act: Call API endpoint with valid payload (designer/admin required)
    const response = await request(app)
      .post("/api/assets")
      .set("X-Vellum-Role", "designer")
      .send({ title: "Landing Page Banner", description: "Sprint 1 demo asset" });

    // Assert: Verify response contract
    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
  });

  test("PATCH /api/assets/:id/status returns 400 when status is invalid", async () => {
    // Arrange: Mock missing lookup status result
    mockQuery.mockResolvedValueOnce({ rows: [] });

    // Act: Call API with an invalid status value (reviewer/admin required)
    const response = await request(app)
      .patch("/api/assets/101/status")
      .set("X-Vellum-Role", "reviewer")
      .send({ status: "NOT_A_REAL_STATUS" });

    // Assert: Verify status validation error
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid status");
  });

  test("GET /api/assets returns list", async () => {
    // Arrange: Mock asset list query response
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, title: "Asset 1", description: null, status: "Draft" }]
    });

    // Act: Request asset list
    const response = await request(app).get("/api/assets");

    // Assert: Verify list response shape
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
  });

  test("POST /api/assets returns 403 without X-Vellum-Role", async () => {
    const response = await request(app)
      .post("/api/assets")
      .send({ title: "Test", description: "" });
    expect(response.status).toBe(403);
    expect(response.body.error).toBeDefined();
  });

  test("POST /api/assets returns 403 for reviewer role", async () => {
    const response = await request(app)
      .post("/api/assets")
      .set("X-Vellum-Role", "reviewer")
      .send({ title: "Test", description: "" });
    expect(response.status).toBe(403);
  });

  test("PATCH /api/assets/:id/status returns 403 for designer role", async () => {
    const response = await request(app)
      .patch("/api/assets/1/status")
      .set("X-Vellum-Role", "designer")
      .send({ status: "Approved" });
    expect(response.status).toBe(403);
  });

  test("POST /api/assets/:id/comments returns 201", async () => {
    // Arrange: Mock comment type lookup + comment insert
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 500,
            asset_id: 10,
            message: "Needs tighter spacing.",
            created_at: "2026-02-17T00:00:00.000Z"
          }
        ]
      });

    // Act: Post new asset comment
    const response = await request(app)
      .post("/api/assets/10/comments")
      .send({ message: "Needs tighter spacing.", commentType: "General" });

    // Assert: Verify created comment response
    expect(response.status).toBe(201);
    expect(response.body.id).toBe(500);
  });

  test("POST /api/assets accepts multipart upload and persists file metadata", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 102 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 102,
            title: "Spec Sheet",
            description: "Uploaded from UI",
            status: "Draft",
            current_version: "v1.0",
            owner: "Designer User",
            original_file_name: "spec-sheet.pdf",
            mime_type: "application/pdf",
            size_bytes: 7,
            file_path: "backend/uploads/fake-spec-sheet.pdf",
            created_at: "2026-03-12T00:00:00.000Z",
            updated_at: "2026-03-12T00:00:00.000Z"
          }
        ]
      });

    const response = await request(app)
      .post("/api/assets")
      .set("X-Vellum-Role", "designer")
      .field("title", "Spec Sheet")
      .field("description", "Uploaded from UI")
      .attach("file", Buffer.from("pdfdata"), "spec-sheet.pdf");

    expect(response.status).toBe(201);
    expect(response.body.file_name).toBe("spec-sheet.pdf");
    expect(mockQuery).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("INSERT INTO asset_versions"),
      expect.arrayContaining([
        102,
        null,
        "spec-sheet.pdf",
        expect.stringMatching(/spec-sheet\.pdf$/),
        "application/pdf",
        7,
        expect.stringMatching(/spec-sheet\.pdf$/)
      ])
    );
  });
});
