import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { jest } from "@jest/globals";
import { AssetDetailPage } from "./AssetDetailPage";
import type { AuthUser } from "../App";
import { getAsset, getAssetVersions, patchAssetStatus, createAssetVersionApi, updateAssetOwner } from "../api/assets";
import { addComment, getComments } from "../api/comments";

jest.mock("../api/assets", () => ({
  getAsset: jest.fn(),
  getAssetVersions: jest.fn(),
  patchAssetStatus: jest.fn(),
  createAssetVersionApi: jest.fn(),
  updateAssetOwner: jest.fn()
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

  const getAssetVersionsMock = getAssetVersions as jest.MockedFunction<typeof getAssetVersions>;
  getAssetVersionsMock.mockResolvedValue([]);

  getAssetMock.mockResolvedValue({
    id: 42,
    name: "Hero Graphic",
    owner: "Designer",
    fileUrl: "/uploads/hero.png",
    fileName: "hero.png",
    mimeType: "image/png",
    status: "In Review",
    backendStatus: "In Internal Review",
    updatedAt: "2026-02-10T00:00:00.000Z",
    currentVersion: "v1.0",
    notes: "Demo details"
  });
  getCommentsMock.mockResolvedValue([]);
  patchAssetStatusMock.mockResolvedValue({
    id: 42,
    name: "Hero Graphic",
    owner: "Designer",
    fileUrl: "/uploads/hero.png",
    fileName: "hero.png",
    mimeType: "image/png",
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

  const reviewer: AuthUser = { id: "9", email: "reviewer@vellum.test", role: "reviewer" };

  render(
    <MemoryRouter initialEntries={["/assets/42"]}>
      <Routes>
        <Route path="/assets/:id" element={<AssetDetailPage currentUser={reviewer} />} />
      </Routes>
    </MemoryRouter>
  );

  expect(await screen.findByText("Hero Graphic")).toBeInTheDocument();
  expect(screen.getByText("Notes: Demo details")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Hero Graphic" })).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Approve" }));
  expect(patchAssetStatusMock).toHaveBeenCalledWith("42", "approved_internal");

  await userEvent.type(screen.getByLabelText("Add Comment"), "Looks good");
  await userEvent.click(screen.getByRole("button", { name: "Post Comment" }));
  expect(addCommentMock).toHaveBeenCalledWith("42", {
    message: "Looks good",
    commentType: "General",
    authorUserId: "9"
  });
});

test("AssetDetailPage Request changes sends changes_requested_internal", async () => {
  const getAssetMock = getAsset as jest.MockedFunction<typeof getAsset>;
  const patchAssetStatusMock = patchAssetStatus as jest.MockedFunction<typeof patchAssetStatus>;
  const getCommentsMock = getComments as jest.MockedFunction<typeof getComments>;
  const getAssetVersionsMock = getAssetVersions as jest.MockedFunction<typeof getAssetVersions>;
  getAssetVersionsMock.mockResolvedValue([]);
  getCommentsMock.mockResolvedValue([]);

  getAssetMock.mockResolvedValue({
    id: 99,
    name: "Draft Social",
    owner: "Designer",
    fileUrl: "/uploads/social.png",
    fileName: "social.png",
    mimeType: "image/png",
    status: "In Review",
    backendStatus: "In Internal Review",
    updatedAt: "2026-02-10T00:00:00.000Z",
    currentVersion: "v1.0",
    notes: null
  });
  patchAssetStatusMock.mockResolvedValue({
    id: 99,
    name: "Draft Social",
    owner: "Designer",
    fileUrl: "/uploads/social.png",
    fileName: "social.png",
    mimeType: "image/png",
    status: "Changes Requested",
    updatedAt: "2026-02-10T00:00:00.000Z",
    currentVersion: "v1.0",
    notes: null
  });

  const reviewer: AuthUser = { id: "9", email: "reviewer@vellum.test", role: "reviewer" };

  render(
    <MemoryRouter initialEntries={["/assets/99"]}>
      <Routes>
        <Route path="/assets/:id" element={<AssetDetailPage currentUser={reviewer} />} />
      </Routes>
    </MemoryRouter>
  );

  expect(await screen.findByText("Draft Social")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Request changes" }));
  expect(patchAssetStatusMock).toHaveBeenCalledWith("99", "changes_requested_internal");
});
