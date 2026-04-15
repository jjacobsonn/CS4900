export type AssetStatus =
  | "In Progress"
  | "In Review"
  | "Approved"
  | "Changes Requested";

export interface Asset {
  id: string | number;
  name: string;
  owner: string;
  projectId?: number | null;
  projectName?: string | null;
  organizationId?: number | null;
  organizationName?: string | null;
  /** User id of the project owner when asset is linked to a project */
  projectOwnerUserId?: number | null;
  thumbnailUrl?: string;
  fileUrl?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  status: AssetStatus;
  /** Exact `asset_status_lookup.status_name` from API — used for workflow actions */
  backendStatus?: string;
  updatedAt: string;
  currentVersion: string;
  currentVersionId?: string | number;
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
  createdBy?: string;
  label?: string | null;
  notes?: string | null;
  status: AssetStatus;
  fileUrl?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
}

export interface UserAccount {
  id: string;
  email: string;
  displayName?: string | null;
  role: "designer" | "reviewer" | "manager" | "owner" | "admin";
  isActive: boolean;
}

export interface Organization {
  id: number;
  name: string;
  description?: string | null;
  details?: string | null;
  isActive?: boolean;
  createdByUserId?: number | null;
  membershipRole?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrganizationMemberRow {
  organizationId: number;
  userId: number;
  role: string;
  email: string;
  displayName: string;
  createdAt?: string;
}

export interface AdminOverview {
  pendingReview: number;
  changesRequested: number;
  approved: number;
}
