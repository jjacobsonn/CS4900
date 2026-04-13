import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { jest } from "@jest/globals";
import { UploadPage } from "./UploadPage";
import { createAsset } from "../api/assets";

jest.mock("../api/assets", () => ({
  createAsset: jest.fn()
}));

jest.mock("../api/projects", () => ({
  getProjects: jest.fn().mockResolvedValue([])
}));

function renderUpload() {
  return render(
    <MemoryRouter>
      <UploadPage role="admin" currentUser={{ id: "7", email: "admin@vellum.test", role: "admin" }} />
    </MemoryRouter>
  );
}

test("upload form validation requires file and title", async () => {
  renderUpload();

  await userEvent.click(screen.getByRole("button", { name: "Submit" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Please select a file.");

  const file = new File(["hello"], "design.png", { type: "image/png" });
  await userEvent.upload(screen.getByLabelText("Choose file to upload"), file);
  await userEvent.click(screen.getByRole("button", { name: "Submit" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Title is required.");
});

test("upload submits when valid", async () => {
  const createAssetMock = createAsset as jest.MockedFunction<typeof createAsset>;
  createAssetMock.mockResolvedValue({
    id: "asset-3",
    name: "New Asset",
    owner: "Admin User",
    status: "Draft",
    updatedAt: "2026-03-12T00:00:00.000Z",
    currentVersion: "v1.0"
  });

  renderUpload();

  const file = new File(["hello"], "design.png", { type: "image/png" });
  await userEvent.upload(screen.getByLabelText("Choose file to upload"), file);
  await userEvent.type(screen.getByLabelText("Title"), "New Asset");
  await userEvent.click(screen.getByRole("button", { name: "Submit" }));

  expect(createAssetMock).toHaveBeenCalledWith({
    title: "New Asset",
    description: "",
    createdByUserId: "7",
    file
  });
});
