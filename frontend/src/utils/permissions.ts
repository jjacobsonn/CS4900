export type Role = "designer" | "reviewer" | "manager" | "client_reviewer" | "admin";

export const allRoles: Role[] = ["designer", "reviewer", "manager", "client_reviewer", "admin"];

export function canReview(role: Role): boolean {
  return role === "designer" || role === "reviewer" || role === "manager" || role === "client_reviewer" || role === "admin";
}

export function canAccessUpload(role: Role): boolean {
  return role === "designer" || role === "manager" || role === "admin";
}
