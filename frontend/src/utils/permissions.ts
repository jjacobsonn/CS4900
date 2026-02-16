export type Role = "designer" | "reviewer" | "admin";

export const allRoles: Role[] = ["designer", "reviewer", "admin"];

export function canReview(role: Role): boolean {
  return role === "reviewer" || role === "admin";
}

export function canAccessUpload(role: Role): boolean {
  return role === "designer" || role === "admin";
}
