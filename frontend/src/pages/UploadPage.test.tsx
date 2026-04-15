import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";
import { UploadPage } from "./UploadPage";
import { createAsset } from "../api/assets";

jest.mock("../api/assets", () => ({
  createAsset: jest.fn()
}));

test("upload form validation requires file and title", async () => {
  render(<UploadPage role="admin" />);

  await userEvent.click(screen.getByRole("button", { name: "Submit" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Please select a file.");

  const file = new File(["hello"], "design.png", { type: "image/png" });
  await userEvent.upload(screen.getByLabelText("File"), file);
  await userEvent.click(screen.getByRole("button", { name: "Submit" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Title is required.");
});

test("upload submits when valid", async () => {
  const createAssetMock = createAsset as jest.MockedFunction<typeof createAsset>;
  createAssetMock.mockResolvedValue({
    id: "asset-3",
    name: "New Asset"
  });

  render(<UploadPage role="admin" />);

  const file = new File(["hello"], "design.png", { type: "image/png" });
  await userEvent.upload(screen.getByLabelText("File"), file);
  await userEvent.type(screen.getByLabelText("Title"), "New Asset");
  await userEvent.click(screen.getByRole("button", { name: "Submit" }));

  expect(createAssetMock).toHaveBeenCalledWith({ title: "New Asset", description: "" });
});
