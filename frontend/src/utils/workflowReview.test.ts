import { getWorkflowReviewActions, getWorkflowStatusButtons, isApproveRequestPair } from "./workflowReview";

describe("getWorkflowStatusButtons", () => {
  test("Ready for Internal Review: internal roles get Start internal review", () => {
    for (const role of ["reviewer", "designer", "manager", "owner", "admin"] as const) {
      expect(getWorkflowStatusButtons("Ready for Internal Review", role)).toEqual([
        { statusKey: "in_internal_review", label: "Start internal review", variant: "primary" }
      ]);
    }
  });

  test("In Internal Review / legacy In Review: internal roles get approve + request changes", () => {
    for (const role of ["reviewer", "designer", "manager", "owner", "admin"] as const) {
      expect(getWorkflowStatusButtons("In Internal Review", role)).toEqual([
        { statusKey: "approved_internal", label: "Approve (internal)", variant: "primary" },
        { statusKey: "changes_requested_internal", label: "Request changes", variant: "secondary" }
      ]);
      expect(getWorkflowStatusButtons("In Review", role)).toEqual([
        { statusKey: "approved_internal", label: "Approve (internal)", variant: "primary" },
        { statusKey: "changes_requested_internal", label: "Request changes", variant: "secondary" }
      ]);
    }
  });

  test("In Client Review: client actors get approve + request", () => {
    for (const role of ["reviewer", "manager", "owner", "admin"] as const) {
      expect(getWorkflowStatusButtons("In Client Review", role)).toEqual([
        { statusKey: "approved_client", label: "Approve (client)", variant: "primary" },
        { statusKey: "client_changes_requested", label: "Request client changes", variant: "secondary" }
      ]);
    }
  });

  test("Draft: designer-like roles can submit", () => {
    expect(getWorkflowStatusButtons("Draft", "designer").map((b) => b.statusKey)).toContain("ready_for_internal_review");
    expect(getWorkflowStatusButtons("Draft", "owner").map((b) => b.statusKey)).toContain("ready_for_internal_review");
  });

  test("Draft: reviewer alone cannot submit", () => {
    expect(getWorkflowStatusButtons("Draft", "reviewer")).toEqual([]);
  });

  test("returns empty when status or role missing", () => {
    expect(getWorkflowStatusButtons(undefined, "reviewer")).toEqual([]);
    expect(getWorkflowStatusButtons("In Internal Review", null)).toEqual([]);
  });
});

describe("isApproveRequestPair", () => {
  test("detects internal and client decision pairs", () => {
    expect(
      isApproveRequestPair([
        { statusKey: "approved_internal", label: "", variant: "primary" },
        { statusKey: "changes_requested_internal", label: "", variant: "secondary" }
      ])
    ).toBe(true);
    expect(
      isApproveRequestPair([
        { statusKey: "approved_client", label: "", variant: "primary" },
        { statusKey: "client_changes_requested", label: "", variant: "secondary" }
      ])
    ).toBe(true);
    expect(
      isApproveRequestPair([
        { statusKey: "ready_for_internal_review", label: "", variant: "primary" },
        { statusKey: "in_progress", label: "", variant: "secondary" }
      ])
    ).toBe(false);
  });
});

describe("getWorkflowReviewActions (compat)", () => {
  test("still maps approve/request pair for active internal review", () => {
    expect(getWorkflowReviewActions("In Internal Review", "reviewer")).toEqual({
      approveKey: "approved_internal",
      requestChangesKey: "changes_requested_internal"
    });
  });

  test("returns null when only begin-review step exists", () => {
    expect(getWorkflowReviewActions("Ready for Internal Review", "reviewer")).toBeNull();
  });
});
