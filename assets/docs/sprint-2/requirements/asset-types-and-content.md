## Asset Types and Content Model — Vellum (Sprint 2)

This document describes the different kinds of assets that can exist within a project and how they are represented in the backend.

It complements:

- `information-architecture-and-entities.md`
- `functional-requirements.md`

---

### 1. Asset type fields

Each asset can carry multiple forms of content:

- **`asset_type`** (TEXT)
  - High-level classification used to drive UI behavior and workflows.
  - Examples: `"image"`, `"figma"`, `"brief"`, `"spec"`, `"ticket"`, etc.
- **`external_url`** (TEXT, optional)
  - Link to an external system or hosted content.
  - Examples: Figma files, Google Docs, GitHub repos/PRs, Discord threads, Salesforce records.
- **File-related fields** (via `asset_versions`)
  - `original_file_name`, `mime_type`, `size_bytes`, `file_path`, `file_url`
  - Represent uploaded files (images, PDFs, decks, etc.) per version.

An asset may have:

- Only a file (no `external_url`).
- Only an `external_url` (no file; link-only asset).
- Both a file and an `external_url`.
- Neither (e.g., a pure text note captured in `description` and comments).

---

### 2. Recommended asset_type values

The backend does not strictly enforce a fixed enum for `asset_type`, but the following values are recommended so the UI can provide tailored experiences:

- **"brief"**: Project briefs or requirements documents.
  - Content: text description, attached doc, or link to Google Doc/Notion.
- **"image"**: Static visual assets (PNG, JPG, SVG, etc.).
  - Content: uploaded file.
- **"mockup"**: High-fidelity UI mockups.
  - Content: uploaded image/PDF or Figma link.
- **"wireframe"**: Low-fidelity screens or flows.
  - Content: uploaded image/PDF or Figma link.
- **"figma"**: Explicit Figma design asset.
  - Content: `external_url` pointing to Figma.
- **"copy"**: Marketing copy / UX writing.
  - Content: text description, attached doc, or Google Doc link.
- **"spec"**: Product or technical specification.
  - Content: Markdown/PDF upload or link to doc.
- **"deck"**: Presentation decks.
  - Content: PPT/Keynote/PDF or Google Slides link.
- **"research"**: Research reports and findings.
  - Content: files and/or links to research repositories.
- **"analytics"**: Analytics dashboards or reports.
  - Content: `external_url` to tools like Looker, GA, etc.
- **"ticket"**: Work items in ticketing systems.
  - Content: `external_url` to Jira/Trello/Linear.
- **"repo"**: Code repositories or pull requests.
  - Content: `external_url` to GitHub/GitLab.
- **"chat"**: Conversation threads.
  - Content: `external_url` to Slack/Discord threads or channels.
- **"crm"**: Customer or opportunity records.
  - Content: `external_url` to Salesforce/HubSpot.
- **"note"**: Internal note or scratchpad.
  - Content: `description` + comments only, no file or link.
- **"checklist"**: QA or launch checklists associated with an asset.
  - Content: text and comments, potentially structured later.
- **"decision"**: Decision logs explaining approvals or scope changes.
  - Content: text and comments, potentially tagged to other assets.

Teams can add more values over time as long as the frontend understands how to present them.

---

### 3. Example payloads

#### 3.1 Figma design asset

```json
{
  "title": "Checkout Flow v2",
  "description": "Updated checkout with address autocomplete",
  "projectId": 1,
  "createdByUserId": 2,
  "assetType": "figma",
  "externalUrl": "https://www.figma.com/file/ABC123/checkout"
}
```

#### 3.2 Uploaded image mockup

`POST /api/assets` with `multipart/form-data`:

```text
title=Hero Banner PNG
description=Final exported hero image
projectId=1
createdByUserId=2
assetType=image
file=@/path/to/hero.png
```

#### 3.3 Internal brief (note-like asset)

```json
{
  "title": "Creative Brief",
  "description": "Goals, target audience, and messaging for the Spring 2026 launch.",
  "projectId": 1,
  "createdByUserId": 2,
  "assetType": "brief"
}
```

---

### 4. UI implications

Using `asset_type` and `external_url`, the UI can:

- Group assets by type in project views (e.g., Briefs, Designs, Research, Tickets).
- Show different icons and detail layouts per type.
- Render link-specific actions (e.g., “Open in Figma”, “Open Jira ticket”, “Open Salesforce”).
- Decide when to prioritize file previews vs. external links vs. raw text.

Future enhancements (beyond Sprint 2) could include:

- Type-specific validation (e.g., `assetType="figma"` requires `externalUrl`).
- Per-type workflows (e.g., research assets require a different review pipeline than visual mockups).
- Configurable per-organization lists of asset types.

