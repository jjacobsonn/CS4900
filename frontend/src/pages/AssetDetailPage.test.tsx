import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { jest } from "@jest/globals";
import App from "../App";
import { addComment } from "../api/comments";

jest.mock("../api/assets", () => ({
  getAsset: jest.fn(async () => ({
    id: "asset-1",
    name: "Homepage Hero",
    owner: "Mina",
    status: "pending",
    updatedAt: "2026-02-10T14:00:00.000Z",
    currentVersion: "v3"
  })),
  getAssets: jest.fn(async () => [])
}));

jest.mock("../api/comments", () => ({
  getComments: jest.fn(async () => [
    {
      id: "comment-1",
      assetId: "asset-1",
      author: "Reviewer A",
      message: "Increase contrast in the title area.",
      createdAt: "2026-02-10T16:00:00.000Z"
    }
  ]),
  addComment: jest.fn(async (_assetId: string, payload: { author: string; message: string }) => ({
    id: "comment-2",
    assetId: "asset-1",
    author: payload.author,
    message: payload.message,
    createdAt: "2026-02-11T16:00:00.000Z"
  }))
}));

jest.mock("../api/versions", () => ({
  getVersions: jest.fn(async () => [
    {
      id: "version-1",
      assetId: "asset-1",
      versionNumber: "v3",
      createdAt: "2026-02-10T14:00:00.000Z",
      status: "pending"
    }
  ])
}));

jest.mock("../pages/AdminPage", () => ({
  AdminPage: () => <div>Admin Page</div>
}));

test("asset detail shows comments and versions from mock service", async () => {
  localStorage.setItem("vellum_token", "mock-token");
  window.history.pushState({}, "", "/assets/asset-1");

  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );

  expect(await screen.findByText("Homepage Hero")).toBeInTheDocument();
  expect(screen.getByText("Increase contrast in the title area.")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Versions" }));
  expect(await screen.findByText("v3")).toBeInTheDocument();
});

test("posting a comment updates the UI", async () => {
  const addCommentMock = addComment as jest.MockedFunction<typeof addComment>;
  addCommentMock.mockClear();
  localStorage.setItem("vellum_token", "mock-token");
  window.history.pushState({}, "", "/assets/asset-1");

  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );

  await screen.findByText("Homepage Hero");
  await userEvent.type(screen.getByLabelText("Add Comment"), "Looks good now.");
  await userEvent.click(screen.getByRole("button", { name: "Post Comment" }));

  expect(await screen.findByText("Looks good now.")).toBeInTheDocument();
  expect(addCommentMock).toHaveBeenCalled();
});
