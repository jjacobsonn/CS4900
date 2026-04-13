export type Role = "designer" | "reviewer" | "manager" | "admin" | "owner";

export const allRoles: Role[] = ["designer", "reviewer", "manager", "owner", "admin"];

export function canReview(role: Role): boolean {
  return (
    role === "designer" ||
    role === "reviewer" ||
    role === "manager" ||
    role === "owner" ||
    role === "admin"
  );
}

export function canAccessUpload(role: Role): boolean {
  return role === "designer" || role === "manager" || role === "owner" || role === "admin";
}

/** Full-site moderation (Admin nav). */
export function canAccessAdmin(role: Role): boolean {
  return role === "admin";
}
