import { Asset, Comment, UserAccount, Version } from "../types/models";

const initialAssets: Asset[] = [
  {
    id: "asset-1",
    name: "Homepage Hero",
    owner: "Mina",
    status: "pending",
    updatedAt: "2026-02-10T14:00:00.000Z",
    currentVersion: "v3"
  },
  {
    id: "asset-2",
    name: "Brand Poster",
    owner: "Jordan",
    status: "approved",
    updatedAt: "2026-02-05T09:30:00.000Z",
    currentVersion: "v5"
  }
];

const initialComments: Record<string, Comment[]> = {
  "asset-1": [
    {
      id: "comment-1",
      assetId: "asset-1",
      author: "Reviewer A",
      message: "Increase contrast in the title area.",
      createdAt: "2026-02-10T16:00:00.000Z"
    }
  ],
  "asset-2": [
    {
      id: "comment-2",
      assetId: "asset-2",
      author: "Admin",
      message: "Final version approved for release.",
      createdAt: "2026-02-06T12:30:00.000Z"
    }
  ]
};

const initialVersions: Record<string, Version[]> = {
  "asset-1": [
    {
      id: "version-1",
      assetId: "asset-1",
      versionNumber: "v3",
      createdAt: "2026-02-10T14:00:00.000Z",
      status: "pending"
    },
    {
      id: "version-2",
      assetId: "asset-1",
      versionNumber: "v2",
      createdAt: "2026-02-09T11:00:00.000Z",
      status: "changes_requested"
    }
  ],
  "asset-2": [
    {
      id: "version-3",
      assetId: "asset-2",
      versionNumber: "v5",
      createdAt: "2026-02-05T09:30:00.000Z",
      status: "approved"
    }
  ]
};

const initialUsers: UserAccount[] = [
  { id: "usr-1", email: "admin@vellum.test", role: "admin", isActive: true },
  { id: "usr-2", email: "designer@vellum.test", role: "designer", isActive: true },
  { id: "usr-3", email: "reviewer@vellum.test", role: "reviewer", isActive: true }
];

export type MockDb = {
  assets: Asset[];
  commentsByAsset: Record<string, Comment[]>;
  versionsByAsset: Record<string, Version[]>;
  users: UserAccount[];
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createMockDb(): MockDb {
  return {
    assets: clone(initialAssets),
    commentsByAsset: clone(initialComments),
    versionsByAsset: clone(initialVersions),
    users: clone(initialUsers)
  };
}
