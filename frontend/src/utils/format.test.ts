import { formatDate, statusLabel } from "./format";

test("status label mapping returns expected labels", () => {
  expect(statusLabel("Draft")).toBe("Draft");
  expect(statusLabel("Approved")).toBe("Approved");
  expect(statusLabel("Changes Requested")).toBe("Changes Requested");
});

test("formatDate returns readable value", () => {
  expect(formatDate("2026-02-10T00:00:00.000Z")).toContain("2026");
});
