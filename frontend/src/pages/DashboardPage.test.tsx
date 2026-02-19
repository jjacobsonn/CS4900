import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { jest } from "@jest/globals";
import { DashboardPage } from "./DashboardPage";
import { getAssets } from "../api/assets";

jest.mock("../api/assets", () => ({
  getAssets: jest.fn()
}));

test("DashboardPage renders assets and filters by status", async () => {
  const getAssetsMock = getAssets as jest.MockedFunction<typeof getAssets>;
  getAssetsMock.mockResolvedValue([
    { id: 1, name: "Asset A", owner: "X", status: "Draft", updatedAt: "", currentVersion: "v1" },
    { id: 2, name: "Asset B", owner: "Y", status: "In Review", updatedAt: "", currentVersion: "v1" },
    { id: 3, name: "Asset C", owner: "Z", status: "Approved", updatedAt: "", currentVersion: "v1" }
  ]);

  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );

  expect(await screen.findByText("Asset A")).toBeInTheDocument();
  expect(screen.getByText("Asset B")).toBeInTheDocument();
  expect(screen.getByText("Asset C")).toBeInTheDocument();

  await userEvent.selectOptions(screen.getByLabelText("Status"), "Draft");
  expect(screen.getByText("Asset A")).toBeInTheDocument();
  expect(screen.queryByText("Asset B")).not.toBeInTheDocument();
  expect(screen.queryByText("Asset C")).not.toBeInTheDocument();
});
