import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { jest } from "@jest/globals";
import { AssetDetailPage } from "./AssetDetailPage";
import { approveAsset, requestChangesAsset } from "../api/assets";

jest.mock("../api/assets", () => ({
  getAsset: jest.fn(async () => ({
    id: "asset-1",
    name: "Homepage Hero",
    owner: "Mina",
    status: "pending",
    updatedAt: "2026-02-10T14:00:00.000Z",
    currentVersion: "v3"
  })),
  approveAsset: jest.fn(),
  requestChangesAsset: jest.fn()
}));

jest.mock("../api/comments", () => ({
  getComments: jest.fn(async () => []),
  addComment: jest.fn()
}));

jest.mock("../api/versions", () => ({
  getVersions: jest.fn(async () => [])
}));

test("approve and request-changes call API layer functions", async () => {
  const approveAssetMock = approveAsset as jest.MockedFunction<typeof approveAsset>;
  const requestChangesAssetMock = requestChangesAsset as jest.MockedFunction<typeof requestChangesAsset>;

  approveAssetMock.mockResolvedValue({
    id: "asset-1",
    name: "Homepage Hero",
    owner: "Mina",
    status: "approved",
    updatedAt: "2026-02-10T14:00:00.000Z",
    currentVersion: "v3"
  });
  requestChangesAssetMock.mockResolvedValue({
    id: "asset-1",
    name: "Homepage Hero",
    owner: "Mina",
    status: "changes_requested",
    updatedAt: "2026-02-10T14:00:00.000Z",
    currentVersion: "v3"
  });

  render(
    <MemoryRouter initialEntries={["/assets/asset-1"]}>
      <Routes>
        <Route path="/assets/:id" element={<AssetDetailPage role="reviewer" />} />
      </Routes>
    </MemoryRouter>
  );

  await screen.findByText("Homepage Hero");
  await userEvent.click(screen.getByRole("button", { name: "Approve" }));
  await userEvent.click(screen.getByRole("button", { name: "Request Changes" }));

  expect(approveAssetMock).toHaveBeenCalledWith("asset-1");
  expect(requestChangesAssetMock).toHaveBeenCalledWith("asset-1");
});
