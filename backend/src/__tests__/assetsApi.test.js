/**
 * Assets API Unit Tests
 *
 * Mocks the database module and exercises assets routes with JWT auth.
 */

import request from "supertest";
import jwt from "jsonwebtoken";
import { jest } from "@jest/globals";
import fs from "fs";
import path from "path";
import os from "os";

process.env.JWT_SECRET = process.env.JWT_SECRET || "unit-test-jwt-secret";

const mockQuery = jest.fn();
const testUploadDir = fs.mkdtempSync(path.join(os.tmpdir(), "vellum-upload-test-"));
process.env.UPLOAD_DIR = testUploadDir;

jest.unstable_mockModule("../config/database.js", () => ({
  query: mockQuery,
  testConnection: jest.fn(async () => true),
  default: {}
}));

const { app } = await import("../server.js");

function bearerAuth(role, sub = "7") {
  const token = jwt.sign({ sub: String(sub), role }, process.env.JWT_SECRET, { expiresIn: "1h" });
  return { Authorization: `Bearer ${token}` };
}

describe("Assets API", () => {
  beforeEach(() => {
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
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({
        rows: [{ id: 101, title: "Landing Page Banner", description: "Sprint 1 demo asset" }]
      })
      .mockResolvedValueOnce({ rows: [] })
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
      });

    const response = await request(app)
      .post("/api/assets")
      .set(bearerAuth("designer"))
      .send({ title: "Landing Page Banner", description: "Sprint 1 demo asset" });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
  });

  test("PATCH /api/assets/:id/status returns 400 when status is invalid", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .patch("/api/assets/101/status")
      .set(bearerAuth("reviewer"))
      .send({ status: "NOT_A_REAL_STATUS" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid status");
  });

  test("GET /api/assets returns 401 without Authorization", async () => {
    const response = await request(app).get("/api/assets");
    expect(response.status).toBe(401);
  });

  test("GET /api/assets returns list with valid JWT", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, title: "Asset 1", description: null, status: "Draft" }]
    });

    const response = await request(app).get("/api/assets").set(bearerAuth("reviewer"));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
  });

  test("POST /api/assets returns 401 without Bearer token", async () => {
    const response = await request(app)
      .post("/api/assets")
      .send({ title: "Test", description: "" });
    expect(response.status).toBe(401);
  });

  test("POST /api/assets returns 403 for reviewer role", async () => {
    const response = await request(app)
      .post("/api/assets")
      .set(bearerAuth("reviewer"))
      .send({ title: "Test", description: "" });
    expect(response.status).toBe(403);
  });

  test("PATCH /api/assets/:id/status returns 400 for non-internal status key (e.g. legacy label)", async () => {
    const response = await request(app)
      .patch("/api/assets/1/status")
      .set(bearerAuth("designer"))
      .send({ status: "Approved" });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid status");
  });

  test("POST /api/assets/:id/comments returns 401 without token", async () => {
    const response = await request(app).post("/api/assets/10/comments").send({ message: "Hi" });
    expect(response.status).toBe(401);
  });

  test("POST /api/assets/:id/comments returns 201 with JWT", async () => {
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
      })
      .mockResolvedValueOnce({ rows: [{ author: "User 99" }] });

    const response = await request(app)
      .post("/api/assets/10/comments")
      .set(bearerAuth("reviewer", "99"))
      .send({ message: "Needs tighter spacing.", commentType: "General" });

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
      .set(bearerAuth("designer", "42"))
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
        42,
        "spec-sheet.pdf",
        expect.stringMatching(/spec-sheet\.pdf$/),
        "application/pdf",
        7,
        expect.stringMatching(/spec-sheet\.pdf$/)
      ])
    );
  });
});
