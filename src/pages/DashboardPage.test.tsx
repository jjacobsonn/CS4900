import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { jest } from "@jest/globals";
import App from "../App";
import { getAssets } from "../api/assets";

jest.mock("../api/assets", () => ({
  getAssets: jest.fn(async () => [
    {
      id: "asset-1",
      name: "Homepage Hero",
      owner: "Mina",
      status: "pending",
      updatedAt: "2026-02-10T14:00:00.000Z",
      currentVersion: "v3"
    },
    {
      id: "asset-2",
      name: "Brand Poster",
      owner: "Jordan",
      status: "approved",
      updatedAt: "2026-02-05T09:30:00.000Z",
      currentVersion: "v5"
    }
  ]),
  getAsset: jest.fn(),
  createAsset: jest.fn(),
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

jest.mock("../pages/AdminPage", () => ({
  AdminPage: () => <div>Admin Page</div>
}));

test("dashboard loads assets from mock service", async () => {
  const getAssetsMock = getAssets as jest.MockedFunction<typeof getAssets>;
  getAssetsMock.mockClear();
  localStorage.setItem("vellum_token", "mock-token");
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );

  expect(await screen.findByText("Homepage Hero")).toBeInTheDocument();
  expect(screen.getByText("Brand Poster")).toBeInTheDocument();
  expect(getAssetsMock).toHaveBeenCalledTimes(1);
});

test("dashboard filters by search and status", async () => {
  localStorage.setItem("vellum_token", "mock-token");
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );

  await screen.findByText("Homepage Hero");
  await userEvent.type(screen.getByPlaceholderText("Search assets"), "brand");
  expect(screen.queryByText("Homepage Hero")).not.toBeInTheDocument();
  expect(screen.getByText("Brand Poster")).toBeInTheDocument();
});
