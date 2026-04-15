import { getWorkflowReviewActions, getWorkflowStatusButtons, isApproveRequestPair } from "./workflowReview";

describe("getWorkflowStatusButtons", () => {
  test("Ready for Internal Review: reviewers can approve or request changes directly", () => {
    for (const role of ["reviewer", "manager", "owner", "admin"] as const) {
      expect(getWorkflowStatusButtons("Ready for Internal Review", role)).toEqual([
        { statusKey: "approved_internal", label: "Approve (internal)", variant: "primary" },
        { statusKey: "changes_requested_internal", label: "Request changes", variant: "secondary" }
      ]);
    }
    expect(getWorkflowStatusButtons("Ready for Internal Review", "designer")).toEqual([]);
  });

  test("In Internal Review / legacy In Review: internal roles get approve + request changes", () => {
    for (const role of ["reviewer", "manager", "owner", "admin"] as const) {
      expect(getWorkflowStatusButtons("In Internal Review", role)).toEqual([
        { statusKey: "approved_internal", label: "Approve (internal)", variant: "primary" },
        { statusKey: "changes_requested_internal", label: "Request changes", variant: "secondary" }
      ]);
      expect(getWorkflowStatusButtons("In Review", role)).toEqual([
        { statusKey: "approved_internal", label: "Approve (internal)", variant: "primary" },
        { statusKey: "changes_requested_internal", label: "Request changes", variant: "secondary" }
      ]);
    }
    expect(getWorkflowStatusButtons("In Internal Review", "designer")).toEqual([]);
    expect(getWorkflowStatusButtons("In Review", "designer")).toEqual([]);
  });

  test("In Client Review: client actors get approve + request", () => {
    for (const role of ["reviewer", "manager", "owner", "admin"] as const) {
      expect(getWorkflowStatusButtons("In Client Review", role)).toEqual([
        { statusKey: "approved_client", label: "Approve (client)", variant: "primary" },
        { statusKey: "client_changes_requested", label: "Request client changes", variant: "secondary" }
      ]);
    }
  });

  test("Draft is not an active workflow state", () => {
    expect(getWorkflowStatusButtons("Draft", "designer")).toEqual([]);
    expect(getWorkflowStatusButtons("Draft", "owner")).toEqual([]);
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

  test("maps approve/request pair for ready internal review", () => {
    expect(getWorkflowReviewActions("Ready for Internal Review", "reviewer")).toEqual({
      approveKey: "approved_internal",
      requestChangesKey: "changes_requested_internal"
    });
  });
});
