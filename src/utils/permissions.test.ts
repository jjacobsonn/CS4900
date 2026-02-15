import { canAccessUpload, canReview } from "./permissions";

test("role permission checks", () => {
  expect(canReview("reviewer")).toBe(true);
  expect(canReview("designer")).toBe(false);
  expect(canAccessUpload("designer")).toBe(true);
  expect(canAccessUpload("reviewer")).toBe(false);
});
