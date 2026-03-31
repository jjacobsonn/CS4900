import { getWorkflowReviewActions } from "./workflowReview";

describe("getWorkflowReviewActions", () => {
  test("internal review: reviewer/designer/manager/admin get approve + request changes keys", () => {
    for (const role of ["reviewer", "designer", "manager", "admin"] as const) {
      expect(getWorkflowReviewActions("In Internal Review", role)).toEqual({
        approveKey: "approved_internal",
        requestChangesKey: "changes_requested_internal"
      });
      expect(getWorkflowReviewActions("In Review", role)).toEqual({
        approveKey: "approved_internal",
        requestChangesKey: "changes_requested_internal"
      });
    }
  });

  test("internal review: client_reviewer cannot act", () => {
    expect(getWorkflowReviewActions("In Internal Review", "client_reviewer")).toBeNull();
  });

  test("client review: client_reviewer/manager/admin only", () => {
    for (const role of ["client_reviewer", "manager", "admin"] as const) {
      expect(getWorkflowReviewActions("In Client Review", role)).toEqual({
        approveKey: "approved_client",
        requestChangesKey: "client_changes_requested"
      });
    }
  });

  test("client review: reviewer cannot act", () => {
    expect(getWorkflowReviewActions("In Client Review", "reviewer")).toBeNull();
  });

  test("returns null when status or role missing", () => {
    expect(getWorkflowReviewActions(undefined, "reviewer")).toBeNull();
    expect(getWorkflowReviewActions("In Internal Review", null)).toBeNull();
    expect(getWorkflowReviewActions("Draft", "reviewer")).toBeNull();
  });
});
