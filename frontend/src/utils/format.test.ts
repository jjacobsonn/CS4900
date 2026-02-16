import { formatDate, statusLabel } from "./format";

test("status label mapping returns expected labels", () => {
  expect(statusLabel("pending")).toBe("Pending");
  expect(statusLabel("approved")).toBe("Approved");
  expect(statusLabel("changes_requested")).toBe("Changes Requested");
});

test("formatDate returns readable value", () => {
  expect(formatDate("2026-02-10T00:00:00.000Z")).toContain("2026");
});
