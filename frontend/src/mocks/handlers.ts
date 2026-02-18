import { http, HttpResponse } from "msw";
import { createMockDb } from "./data";

let db = createMockDb();

export function resetMockData() {
  db = createMockDb();
}

export const handlers = [
  http.get("/api/assets", () => HttpResponse.json(db.assets)),
  http.get("/api/assets/:id", ({ params }) => {
    const assetId = Number(params.id);
    const asset = db.assets.find((entry) => entry.id === assetId);
    if (!asset) return new HttpResponse("Asset not found", { status: 404 });
    return HttpResponse.json(asset);
  }),
  http.post("/api/assets", async ({ request }) => {
    const body = (await request.json()) as { title: string; description?: string };
    const now = new Date().toISOString();
    const nextId = db.assets.reduce((max, asset) => Math.max(max, asset.id), 0) + 1;
    const newAsset = {
      id: nextId,
      title: body.title,
      description: body.description ?? null,
      owner: "Frontend User",
      status: "Draft" as const,
      current_version: "v1.0",
      created_at: now,
      updated_at: now
    };
    db.assets.unshift(newAsset);
    db.commentsByAsset[String(newAsset.id)] = [];
    return HttpResponse.json(newAsset, { status: 201 });
  }),
  http.patch("/api/assets/:id/status", async ({ params, request }) => {
    const body = (await request.json()) as { status: string };
    const assetId = Number(params.id);
    const asset = db.assets.find((entry) => entry.id === assetId);
    if (!asset) return new HttpResponse("Asset not found", { status: 404 });
    asset.status = body.status as typeof asset.status;
    asset.updated_at = new Date().toISOString();
    return HttpResponse.json(asset);
  }),
  http.get("/api/assets/:id/comments", ({ params }) =>
    HttpResponse.json(db.commentsByAsset[String(params.id)] || [])),
  http.post("/api/assets/:id/comments", async ({ params, request }) => {
    const body = (await request.json()) as { message: string; commentType?: string };
    const assetId = Number(params.id);
    const nextId =
      Object.values(db.commentsByAsset).flat().reduce((max, comment) => Math.max(max, comment.id), 0) + 1;
    const next = {
      id: nextId,
      asset_id: assetId,
      author: "Frontend User",
      message: body.message,
      created_at: new Date().toISOString(),
      comment_type: body.commentType || "General"
    };
    const existing = db.commentsByAsset[String(params.id)] || [];
    db.commentsByAsset[String(params.id)] = [...existing, next];
    return HttpResponse.json(next, { status: 201 });
  }),
  http.get("/api/admin/overview", () => {
    const counts = db.assets.reduce(
      (acc, asset) => {
        if (asset.status === "Approved") acc.approved += 1;
        else if (asset.status === "Changes Requested") acc.changesRequested += 1;
        else acc.pendingReview += 1;
        return acc;
      },
      { pendingReview: 0, changesRequested: 0, approved: 0 }
    );
    return HttpResponse.json(counts);
  }),
  http.get("/api/users", () => HttpResponse.json(db.users)),
  http.post("/api/users", async ({ request }) => {
    const body = (await request.json()) as { email: string; role: "designer" | "reviewer" | "admin" };
    const created = {
      id: `usr-${Date.now()}`,
      email: body.email,
      role: body.role,
      isActive: true
    };
    db.users.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),
  http.put("/api/users/:id", async ({ params, request }) => {
    const body = (await request.json()) as { role: "designer" | "reviewer" | "admin" };
    const user = db.users.find((entry) => entry.id === params.id);
    if (!user) return new HttpResponse("User not found", { status: 404 });
    user.role = body.role;
    return HttpResponse.json(user);
  })
];
