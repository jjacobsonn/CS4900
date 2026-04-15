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
const { updateAssetStatus } = await import("../services/assetService.js");

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
      .mockResolvedValueOnce({ rows: [{ organization_id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ role: "DESIGNER" }] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 2 }] })
      .mockResolvedValueOnce({ rows: [{ id: 101 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 101,
            title: "Landing Page Banner",
            description: "Sprint 1 demo asset",
            status: "Ready for Internal Review",
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
      .send({ title: "Landing Page Banner", description: "Sprint 1 demo asset", projectId: 1 });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
  });

  test("PATCH /api/assets/:id/status returns 400 when status is invalid", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ project_id: 1, created_by_user_id: 99, organization_id: 1 }]
      })
      .mockResolvedValueOnce({ rows: [{ organization_id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ role: "REVIEWER" }] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] });

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
      rows: [{ id: 1, title: "Asset 1", description: null, status: "Ready for Internal Review" }]
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
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ project_id: 1, created_by_user_id: 7, organization_id: 1 }]
      })
      .mockResolvedValueOnce({ rows: [{ organization_id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ role: "DESIGNER" }] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const response = await request(app)
      .patch("/api/assets/1/status")
      .set(bearerAuth("designer"))
      .send({ status: "Approved" });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid status");
  });

  test("service rejects designer approval transitions", async () => {
    const updated = await updateAssetStatus(1, "approved_internal", "designer");

    expect(updated).toEqual({
      invalidStatus: true,
      reason: "Role cannot perform this status transition"
    });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test("service allows reviewer to approve ready internal review directly", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ status_name: "Ready for Internal Review" }] })
      .mockResolvedValueOnce({ rows: [{ id: 3, status_name: "Approved (Internal)" }] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            title: "Asset 1",
            description: null,
            status: "Approved (Internal)",
            current_version: "v1.0",
            owner: "Designer User",
            created_at: "2026-02-17T00:00:00.000Z",
            updated_at: "2026-02-17T00:00:00.000Z"
          }
        ]
      });

    const updated = await updateAssetStatus(1, "approved_internal", "reviewer");

    expect(updated.status).toBe("Approved (Internal)");
  });

  test("service allows designer to move requested changes back to in progress", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ status_name: "Changes Requested (Internal)" }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, status_name: "In Progress" }] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            title: "Asset 1",
            description: null,
            status: "In Progress",
            current_version: "v1.0",
            owner: "Designer User",
            created_at: "2026-02-17T00:00:00.000Z",
            updated_at: "2026-02-17T00:00:00.000Z"
          }
        ]
      });

    const updated = await updateAssetStatus(1, "in_progress", "designer");

    expect(updated.status).toBe("In Progress");
  });

  test("POST /api/assets/:id/comments returns 401 without token", async () => {
    const response = await request(app).post("/api/assets/10/comments").send({ message: "Hi" });
    expect(response.status).toBe(401);
  });

  test("POST /api/assets/:id/comments returns 201 with JWT", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ project_id: 10, created_by_user_id: 1, organization_id: 1 }]
      })
      .mockResolvedValueOnce({ rows: [{ organization_id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ role: "REVIEWER" }] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
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

  test("POST /api/assets/:id/comments returns 400 when asset has no version row", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ project_id: 10, created_by_user_id: 1, organization_id: 1 }]
      })
      .mockResolvedValueOnce({ rows: [{ organization_id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ role: "REVIEWER" }] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 10 }] });

    const response = await request(app)
      .post("/api/assets/10/comments")
      .set(bearerAuth("reviewer", "99"))
      .send({ message: "No version to attach to.", commentType: "General" });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/no file version/i);
  });

  test("POST /api/assets accepts multipart upload and persists file metadata", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ organization_id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ role: "DESIGNER" }] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 2 }] })
      .mockResolvedValueOnce({ rows: [{ id: 102 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 102,
            title: "Spec Sheet",
            description: "Uploaded from UI",
            status: "Ready for Internal Review",
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
      .field("projectId", "1")
      .attach("file", Buffer.from("pdfdata"), "spec-sheet.pdf");

    expect(response.status).toBe(201);
    expect(response.body.file_name).toBe("spec-sheet.pdf");
    expect(mockQuery).toHaveBeenNthCalledWith(
      7,
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
