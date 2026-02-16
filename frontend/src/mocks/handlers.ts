import { http, HttpResponse } from "msw";
import { createMockDb } from "./data";
import { AssetStatus } from "../types/models";

let db = createMockDb();

export function resetMockData() {
  db = createMockDb();
}

export const handlers = [
  http.get("/api/assets", () => HttpResponse.json(db.assets)),
  http.get("/api/assets/:id", ({ params }) => {
    const asset = db.assets.find((entry) => entry.id === params.id);
    if (!asset) return new HttpResponse("Asset not found", { status: 404 });
    return HttpResponse.json(asset);
  }),
  http.post("/api/assets", async ({ request }) => {
    const body = (await request.json()) as { name: string; notes?: string };
    const newAsset = {
      id: `asset-${db.assets.length + 1}`,
      name: body.name,
      owner: "Frontend User",
      status: "pending" as const,
      updatedAt: new Date().toISOString(),
      currentVersion: "v1",
      notes: body.notes
    };
    db.assets.unshift(newAsset);
    db.commentsByAsset[newAsset.id] = [];
    db.versionsByAsset[newAsset.id] = [
      {
        id: `version-${Date.now()}`,
        assetId: newAsset.id,
        versionNumber: "v1",
        createdAt: newAsset.updatedAt,
        status: "pending"
      }
    ];
    return HttpResponse.json(newAsset, { status: 201 });
  }),
  http.put("/api/assets/:id/status", async ({ params, request }) => {
    const body = (await request.json()) as { status: AssetStatus };
    const asset = db.assets.find((entry) => entry.id === params.id);
    if (!asset) return new HttpResponse("Asset not found", { status: 404 });
    asset.status = body.status;
    asset.updatedAt = new Date().toISOString();
    return HttpResponse.json(asset);
  }),
  http.post("/api/assets/:id/versions", async ({ params, request }) => {
    const body = (await request.json()) as { fileName: string };
    const asset = db.assets.find((entry) => entry.id === params.id);
    if (!asset) return new HttpResponse("Asset not found", { status: 404 });
    const existing = db.versionsByAsset[String(params.id)] || [];
    const newest = existing.reduce((max, version) => {
      const n = Number(version.versionNumber.replace("v", ""));
      return Number.isFinite(n) && n > max ? n : max;
    }, 0);
    const nextVersion = {
      id: `version-${Date.now()}`,
      assetId: String(params.id),
      versionNumber: `v${newest + 1}`,
      createdAt: new Date().toISOString(),
      status: "pending" as const
    };
    db.versionsByAsset[String(params.id)] = [nextVersion, ...existing];
    asset.currentVersion = nextVersion.versionNumber;
    asset.status = "pending";
    asset.updatedAt = nextVersion.createdAt;
    asset.notes = body.fileName;
    return HttpResponse.json(nextVersion, { status: 201 });
  }),
  http.get("/api/assets/:id/comments", ({ params }) =>
    HttpResponse.json(db.commentsByAsset[String(params.id)] || [])),
  http.post("/api/assets/:id/comments", async ({ params, request }) => {
    const body = (await request.json()) as { author: string; message: string };
    const next = {
      id: `comment-${Date.now()}`,
      assetId: String(params.id),
      author: body.author,
      message: body.message,
      createdAt: new Date().toISOString()
    };
    const existing = db.commentsByAsset[String(params.id)] || [];
    db.commentsByAsset[String(params.id)] = [...existing, next];
    return HttpResponse.json(next, { status: 201 });
  }),
  http.get("/api/assets/:id/versions", ({ params }) =>
    HttpResponse.json(db.versionsByAsset[String(params.id)] || [])),
  http.get("/api/admin/overview", () => {
    const counts = db.assets.reduce(
      (acc, asset) => {
        if (asset.status === "approved") acc.approved += 1;
        else if (asset.status === "changes_requested") acc.changesRequested += 1;
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
