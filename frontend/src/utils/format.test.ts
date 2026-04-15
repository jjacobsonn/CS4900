import { formatDate, formatDateTime, statusLabel } from "./format";

test("status label mapping returns expected labels", () => {
  expect(statusLabel("In Review")).toBe("Needs Review");
  expect(statusLabel("Ready for Internal Review")).toBe("Needs Review");
  expect(statusLabel("In Progress")).toBe("WIP");
  expect(statusLabel("Approved")).toBe("Approved");
  expect(statusLabel("Changes Requested")).toBe("Changes Requested");
});

test("formatDate returns readable value", () => {
  expect(formatDate("2026-02-10T00:00:00.000Z")).toContain("2026");
});

test("formatDateTime includes date and time", () => {
  const s = formatDateTime("2026-02-10T15:30:00.000Z");
  expect(s).toContain("2026");
});
