export type AssetStatus =
  | "Draft"
  | "In Review"
  | "Approved"
  | "Changes Requested";

export interface Asset {
  id: string | number;
  name: string;
  owner: string;
  thumbnailUrl?: string;
  status: AssetStatus;
  updatedAt: string;
  currentVersion: string;
  notes?: string;
}

export interface Comment {
  id: string;
  assetId: string;
  author: string;
  message: string;
  createdAt: string;
}

export interface Version {
  id: string;
  assetId: string;
  versionNumber: string;
  createdAt: string;
  status: AssetStatus;
}

export interface UserAccount {
  id: string;
  email: string;
  displayName?: string | null;
  role: "designer" | "reviewer" | "admin";
  isActive: boolean;
}

export interface AdminOverview {
  pendingReview: number;
  changesRequested: number;
  approved: number;
}
