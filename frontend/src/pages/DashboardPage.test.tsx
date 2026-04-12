import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { jest } from "@jest/globals";
import { DashboardPage } from "./DashboardPage";
import { getAssets } from "../api/assets";
import { getProjects } from "../api/projects";

jest.mock("../api/assets", () => ({
  getAssets: jest.fn()
}));

jest.mock("../api/projects", () => ({
  getProjects: jest.fn()
}));

test("DashboardPage renders assets and filters by status", async () => {
  const getAssetsMock = getAssets as jest.MockedFunction<typeof getAssets>;
  const getProjectsMock = getProjects as jest.MockedFunction<typeof getProjects>;
  getAssetsMock.mockResolvedValue([
    { id: 1, name: "Asset A", owner: "X", status: "Draft", updatedAt: "", currentVersion: "v1" },
    { id: 2, name: "Asset B", owner: "Y", status: "In Review", updatedAt: "", currentVersion: "v1" },
    { id: 3, name: "Asset C", owner: "Z", status: "Approved", updatedAt: "", currentVersion: "v1" }
  ]);
  getProjectsMock.mockResolvedValue([]);

  render(
    <MemoryRouter>
      <DashboardPage role="reviewer" />
    </MemoryRouter>
  );

  expect(await screen.findByText("Asset B")).toBeInTheDocument();
  expect(screen.getByText("Asset A")).toBeInTheDocument();
  expect(screen.queryByText("Asset C")).not.toBeInTheDocument();

  await userEvent.selectOptions(screen.getByLabelText("Queue Scope"), "Draft");
  expect(screen.getByText("Asset A")).toBeInTheDocument();
  expect(screen.queryByText("Asset B")).not.toBeInTheDocument();
  expect(screen.queryByText("Asset C")).not.toBeInTheDocument();
});
