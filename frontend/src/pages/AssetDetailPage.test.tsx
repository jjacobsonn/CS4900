import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { jest } from "@jest/globals";
import { AssetDetailPage } from "./AssetDetailPage";
import { getAsset, patchAssetStatus } from "../api/assets";
import { addComment, getComments } from "../api/comments";

jest.mock("../api/assets", () => ({
  getAsset: jest.fn(),
  patchAssetStatus: jest.fn()
}));

jest.mock("../api/comments", () => ({
  getComments: jest.fn(),
  addComment: jest.fn()
}));

test("AssetDetailPage loads asset, updates status, and posts comment", async () => {
  const getAssetMock = getAsset as jest.MockedFunction<typeof getAsset>;
  const patchAssetStatusMock = patchAssetStatus as jest.MockedFunction<typeof patchAssetStatus>;
  const getCommentsMock = getComments as jest.MockedFunction<typeof getComments>;
  const addCommentMock = addComment as jest.MockedFunction<typeof addComment>;

  getAssetMock.mockResolvedValue({
    id: 42,
    name: "Hero Graphic",
    owner: "Designer",
    status: "In Review",
    updatedAt: "2026-02-10T00:00:00.000Z",
    currentVersion: "v1.0",
    notes: "Demo details"
  });
  getCommentsMock.mockResolvedValue([]);
  patchAssetStatusMock.mockResolvedValue({
    id: 42,
    name: "Hero Graphic",
    owner: "Designer",
    status: "Approved",
    updatedAt: "2026-02-10T00:00:00.000Z",
    currentVersion: "v1.0",
    notes: "Demo details"
  });
  addCommentMock.mockResolvedValue({
    id: 7,
    asset_id: 42,
    message: "Looks good",
    created_at: "2026-02-10T00:00:00.000Z"
  });

  render(
    <MemoryRouter initialEntries={["/assets/42"]}>
      <Routes>
        <Route path="/assets/:id" element={<AssetDetailPage />} />
      </Routes>
    </MemoryRouter>
  );

  expect(await screen.findByText("Hero Graphic")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Approve" }));
  expect(patchAssetStatusMock).toHaveBeenCalledWith("42", "Approved");

  await userEvent.type(screen.getByLabelText("Add Comment"), "Looks good");
  await userEvent.click(screen.getByRole("button", { name: "Post Comment" }));
  expect(addCommentMock).toHaveBeenCalledWith("42", {
    message: "Looks good",
    commentType: "General"
  });
});
