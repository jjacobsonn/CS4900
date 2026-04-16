/**
 * Project API tests for Sprint 3 project assignment authorization.
 */

import request from "supertest";
import jwt from "jsonwebtoken";
import { jest } from "@jest/globals";

process.env.JWT_SECRET = process.env.JWT_SECRET || "unit-test-jwt-secret";

const mockQuery = jest.fn();

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

describe("Projects API member assignments", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  test("GET /api/projects/:projectId/members allows assigned project member to view team", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ organization_id: 20 }] }) // project org lookup
      .mockResolvedValueOnce({ rows: [{ role: "DESIGNER" }] }) // actor org role
      .mockResolvedValueOnce({ rows: [{ "?column?": 1 }] }) // explicit project assignment
      .mockResolvedValueOnce({
        rows: [
          {
            project_id: 10,
            user_id: 8,
            assigned_at: "2026-04-14T00:00:00.000Z",
            email: "designer@example.com",
            display_name: "Demo Designer",
            role: "designer"
          }
        ]
      });

    const response = await request(app)
      .get("/api/projects/10/members")
      .set(bearerAuth("designer", "8"));

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      expect.objectContaining({
        project_id: 10,
        user_id: 8,
        email: "designer@example.com",
        role: "designer"
      })
    ]);
  });

  test("POST /api/projects/:projectId/members blocks manager assigning platform admin", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ organization_id: 20 }] }) // assertProjectMembership org lookup
      .mockResolvedValueOnce({ rows: [{ role: "MANAGER" }] }) // actor org role
      .mockResolvedValueOnce({ rows: [{ organization_id: 20 }] }) // project exists/org lookup
      .mockResolvedValueOnce({ rows: [{ "?column?": 1 }] }) // target belongs to org
      .mockResolvedValueOnce({ rows: [{ role: "admin" }] }); // target global role

    const response = await request(app)
      .post("/api/projects/10/members")
      .set(bearerAuth("manager", "3"))
      .send({ userId: 1 });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Managers cannot assign platform admins to projects");
    expect(mockQuery).not.toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO project_members"),
      expect.any(Array)
    );
  });

  test("POST /api/projects/:projectId/members lets admin assign organization member", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ organization_id: 20 }] }) // project exists/org lookup
      .mockResolvedValueOnce({ rows: [{ "?column?": 1 }] }) // target belongs to org
      .mockResolvedValueOnce({ rows: [] }); // insert

    const response = await request(app)
      .post("/api/projects/10/members")
      .set(bearerAuth("admin", "1"))
      .send({ userId: 8 });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ projectId: 10, userId: 8 });
    expect(mockQuery).toHaveBeenLastCalledWith(
      expect.stringContaining("INSERT INTO project_members"),
      [10, 8, 1]
    );
  });

  test("DELETE /api/projects/:projectId/members/:userId requires manager scope", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ organization_id: 20 }] }) // project org lookup
      .mockResolvedValueOnce({ rows: [{ role: "DESIGNER" }] }) // actor org role
      .mockResolvedValueOnce({ rows: [{ "?column?": 1 }] }); // explicit assignment only

    const response = await request(app)
      .delete("/api/projects/10/members/8")
      .set(bearerAuth("designer", "8"));

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Forbidden");
    expect(mockQuery).not.toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM project_members"),
      expect.any(Array)
    );
  });
});
