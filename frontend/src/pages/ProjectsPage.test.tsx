import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { jest } from "@jest/globals";
import { ProjectsPage } from "./ProjectsPage";
import { getOrganizationMembers, getOrganizations } from "../api/organizations";
import {
  addProjectMember,
  getProjectMembers,
  getProjects,
  removeProjectMember
} from "../api/projects";

jest.mock("../api/organizations", () => ({
  getOrganizations: jest.fn(),
  getOrganizationMembers: jest.fn()
}));

jest.mock("../api/projects", () => ({
  addProjectMember: jest.fn(),
  createProject: jest.fn(),
  deleteProject: jest.fn(),
  getProjectMembers: jest.fn(),
  getProjects: jest.fn(),
  removeProjectMember: jest.fn(),
  updateProject: jest.fn()
}));

test("ProjectsPage manager team view hides admin and owner assignment targets", async () => {
  const getProjectsMock = getProjects as jest.MockedFunction<typeof getProjects>;
  const getOrganizationsMock = getOrganizations as jest.MockedFunction<typeof getOrganizations>;
  const getProjectMembersMock = getProjectMembers as jest.MockedFunction<typeof getProjectMembers>;
  const getOrganizationMembersMock = getOrganizationMembers as jest.MockedFunction<typeof getOrganizationMembers>;
  const addProjectMemberMock = addProjectMember as jest.MockedFunction<typeof addProjectMember>;
  const removeProjectMemberMock = removeProjectMember as jest.MockedFunction<typeof removeProjectMember>;

  getProjectsMock.mockResolvedValue([
    {
      id: 10,
      name: "Launch Plan",
      status: "Active",
      organizationId: 20,
      organizationName: "Acme",
      assetCount: 2
    }
  ]);
  getOrganizationsMock.mockResolvedValue([
    { id: 20, name: "Acme", isActive: true }
  ]);
  getProjectMembersMock.mockResolvedValue([
    {
      projectId: 10,
      userId: 1,
      email: "admin@vellum.test",
      displayName: "Admin",
      role: "admin"
    },
    {
      projectId: 10,
      userId: 3,
      email: "reviewer@example.com",
      displayName: "Reviewer",
      role: "reviewer"
    }
  ]);
  getOrganizationMembersMock.mockResolvedValue([
    {
      organization_id: 20,
      user_id: 2,
      userId: 2,
      email: "owner@example.com",
      display_name: "Owner",
      displayName: "Owner",
      role: "OWNER"
    },
    {
      organization_id: 20,
      user_id: 4,
      userId: 4,
      email: "designer@example.com",
      display_name: "Designer",
      displayName: "Designer",
      role: "DESIGNER"
    }
  ]);
  addProjectMemberMock.mockResolvedValue(undefined);
  removeProjectMemberMock.mockResolvedValue(undefined);

  render(
    <MemoryRouter>
      <ProjectsPage role="manager" />
    </MemoryRouter>
  );

  await screen.findByText("Launch Plan");
  await userEvent.click(screen.getByRole("button", { name: "Team" }));

  expect(await screen.findByText("Reviewer")).toBeInTheDocument();
  expect(screen.queryByText("Admin")).not.toBeInTheDocument();

  const addUserSelect = screen.getByLabelText("Add organization user");
  expect(within(addUserSelect).queryByText("Owner (owner)")).not.toBeInTheDocument();
  expect(within(addUserSelect).getByText("Designer (designer)")).toBeInTheDocument();

  await userEvent.selectOptions(addUserSelect, "4");
  await userEvent.click(screen.getByRole("button", { name: "Add to project" }));

  expect(addProjectMemberMock).toHaveBeenCalledWith(10, 4);
});
