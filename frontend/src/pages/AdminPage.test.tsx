import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { jest } from "@jest/globals";
import { AdminPage } from "./AdminPage";
import { getAdminOverview } from "../api/admin";
import { getClients } from "../api/clients";
import { getOrganizations } from "../api/organizations";
import { getProjects } from "../api/projects";
import { createUser, getUsers } from "../api/users";

jest.mock("../api/admin", () => ({
  getAdminOverview: jest.fn()
}));

jest.mock("../api/clients", () => ({
  getClients: jest.fn()
}));

jest.mock("../api/organizations", () => ({
  createOrganization: jest.fn(),
  getOrganizations: jest.fn()
}));

jest.mock("../api/projects", () => ({
  createProject: jest.fn(),
  deleteProject: jest.fn(),
  getProject: jest.fn(),
  getProjects: jest.fn(),
  updateProject: jest.fn()
}));

jest.mock("../api/users", () => ({
  createUser: jest.fn(),
  getUsers: jest.fn(),
  removeUser: jest.fn(),
  updateUser: jest.fn(),
  updateUserActive: jest.fn()
}));

test("AdminPage blocks create user when password confirmation does not match", async () => {
  const getAdminOverviewMock = getAdminOverview as jest.MockedFunction<typeof getAdminOverview>;
  const getUsersMock = getUsers as jest.MockedFunction<typeof getUsers>;
  const createUserMock = createUser as jest.MockedFunction<typeof createUser>;
  const getProjectsMock = getProjects as jest.MockedFunction<typeof getProjects>;
  const getClientsMock = getClients as jest.MockedFunction<typeof getClients>;
  const getOrganizationsMock = getOrganizations as jest.MockedFunction<typeof getOrganizations>;

  getAdminOverviewMock.mockResolvedValue({ pendingReview: 0, changesRequested: 0, approved: 0 });
  getUsersMock.mockResolvedValue([]);
  getProjectsMock.mockResolvedValue([]);
  getClientsMock.mockResolvedValue([]);
  getOrganizationsMock.mockResolvedValue([]);

  render(
    <MemoryRouter>
      <AdminPage currentUser={{ id: "1", email: "admin@vellum.test", role: "admin" }} />
    </MemoryRouter>
  );

  await screen.findByText("User Management");
  await userEvent.click(screen.getByRole("button", { name: "Create User" }));
  const dialog = within(screen.getByRole("dialog", { name: "Create user" }));
  await userEvent.type(screen.getByLabelText("User Email"), "new-user@example.com");
  await userEvent.type(screen.getByLabelText("Display name"), "New User");
  await userEvent.type(screen.getByLabelText("Set password (optional)"), "TestPass123!");
  await userEvent.type(screen.getByLabelText("Confirm password"), "Different123!");
  await userEvent.click(dialog.getByRole("button", { name: "Create User" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Password confirmation does not match.");
  expect(createUserMock).not.toHaveBeenCalled();
});
