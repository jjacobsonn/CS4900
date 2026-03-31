import { normalizeWorkflowDisplayStatus } from "./assetStatus";

describe("normalizeWorkflowDisplayStatus", () => {
  test("Sprint 2 lookup names map to dashboard buckets", () => {
    expect(normalizeWorkflowDisplayStatus("In Internal Review")).toBe("In Review");
    expect(normalizeWorkflowDisplayStatus("In Review")).toBe("In Review");
    expect(normalizeWorkflowDisplayStatus("Ready for Internal Review")).toBe("In Review");
    expect(normalizeWorkflowDisplayStatus("Changes Requested (Internal)")).toBe("Changes Requested");
    expect(normalizeWorkflowDisplayStatus("Approved (Internal)")).toBe("Approved");
    expect(normalizeWorkflowDisplayStatus("In Progress")).toBe("In Progress");
    expect(normalizeWorkflowDisplayStatus("In Client Review")).toBe("In Review");
    expect(normalizeWorkflowDisplayStatus("Client Changes Requested")).toBe("Changes Requested");
    expect(normalizeWorkflowDisplayStatus("Approved (Client)")).toBe("Approved");
  });

  test("legacy and empty", () => {
    expect(normalizeWorkflowDisplayStatus("")).toBe("Draft");
    expect(normalizeWorkflowDisplayStatus(undefined)).toBe("Draft");
    expect(normalizeWorkflowDisplayStatus("Unknown Future Status")).toBe("Draft");
  });
});
