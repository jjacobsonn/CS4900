import { Role } from "../utils/permissions";

export interface MockAssetRow {
  id: number;
  title: string;
  description: string | null;
  status: "Draft" | "In Review" | "Approved" | "Changes Requested";
  owner: string;
  current_version: string;
  created_at: string;
  updated_at: string;
}

export interface MockCommentRow {
  id: number;
  asset_id: number;
  message: string;
  created_at: string;
  author: string;
  comment_type: string;
}

export interface MockUserRow {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
}

const initialAssets: MockAssetRow[] = [
  {
    id: 1,
    title: "Homepage Hero Banner",
    description: "Main campaign hero graphic for spring launch.",
    status: "In Review",
    owner: "Designer User",
    current_version: "v2.0",
    created_at: "2026-02-10T14:00:00.000Z",
    updated_at: "2026-02-10T14:00:00.000Z"
  },
  {
    id: 2,
    title: "Instagram Carousel Set",
    description: "5-card promo carousel with CTA variants.",
    status: "Draft",
    owner: "Designer User",
    current_version: "v1.3",
    created_at: "2026-02-05T09:30:00.000Z",
    updated_at: "2026-02-05T09:30:00.000Z"
  }
];

const initialComments: Record<string, MockCommentRow[]> = {
  "1": [
    {
      id: 1,
      asset_id: 1,
      message: "Increase contrast in the title area.",
      created_at: "2026-02-10T16:00:00.000Z",
      author: "Reviewer User",
      comment_type: "Changes Requested"
    }
  ],
  "2": [
    {
      id: 2,
      asset_id: 2,
      message: "Looks ready for review.",
      created_at: "2026-02-06T12:30:00.000Z",
      author: "Admin User",
      comment_type: "General"
    }
  ]
};

const initialUsers: MockUserRow[] = [
  { id: "usr-1", email: "admin@vellum.test", role: "admin", isActive: true },
  { id: "usr-2", email: "designer@vellum.test", role: "designer", isActive: true },
  { id: "usr-3", email: "reviewer@vellum.test", role: "reviewer", isActive: true }
];

export type MockDb = {
  assets: MockAssetRow[];
  commentsByAsset: Record<string, MockCommentRow[]>;
  users: MockUserRow[];
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createMockDb(): MockDb {
  return {
    assets: clone(initialAssets),
    commentsByAsset: clone(initialComments),
    users: clone(initialUsers)
  };
}
