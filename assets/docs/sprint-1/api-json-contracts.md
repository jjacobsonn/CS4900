## JSON Web Service Input and Output — Vellum

This document defines the RESTful JSON request and response contracts for the Vellum API.
All endpoints use JSON for data exchange and support reviewing versioned files of multiple types.

---

## Conventions

### Base URL

`/api`

### Authentication

* Protected endpoints require:
  `Authorization: Bearer <JWT>`
* JWT claims include:

  * `userId`
  * `role`

### Standard Response Envelope

**Success**

```json
{
  "ok": true,
  "data": {}
}
```

**Error**

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

---

## 1. Authentication

### POST /api/auth/login

Authenticate a user and return a JWT.

**Request**

```json
{
  "email": "user@company.com",
  "password": "Password123!"
}
```

**Response**

```json
{
  "ok": true,
  "data": {
    "token": "jwt.token.value",
    "user": {
      "id": "usr_001",
      "email": "user@company.com",
      "role": "REVIEWER"
    }
  }
}
```

---

## 2. User Management (Admin Only)

### POST /api/users

Create a new user.

**Request**

```json
{
  "email": "designer@company.com",
  "password": "TempPassword123!",
  "role": "DESIGNER"
}
```

**Response**

```json
{
  "ok": true,
  "data": {
    "id": "usr_002",
    "email": "designer@company.com",
    "role": "DESIGNER",
    "isActive": true,
    "createdAt": "2026-01-19T18:00:00Z"
  }
}
```

---

## 3. Files

### GET /api/files

Return a list of files accessible to the authenticated user.

**Response**

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "fil_001",
        "name": "requirements.docx",
        "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "extension": "docx",
        "sizeBytes": 204800,
        "status": "PENDING_REVIEW",
        "currentVersion": 2,
        "createdBy": "usr_002",
        "createdAt": "2026-01-18T20:10:00Z"
      }
    ]
  }
}
```

---

### POST /api/files

Upload a new file (creates version 1).

**Content-Type:** `multipart/form-data`

**Form Fields**

* `file`: binary file
* `name`: optional display name

**Response**

```json
{
  "ok": true,
  "data": {
    "file": {
      "id": "fil_002",
      "name": "data.csv",
      "mimeType": "text/csv",
      "extension": "csv",
      "sizeBytes": 10240,
      "status": "PENDING_REVIEW",
      "currentVersion": 1,
      "createdBy": "usr_002",
      "createdAt": "2026-01-19T18:30:00Z"
    },
    "version": {
      "id": "ver_001",
      "versionNumber": 1,
      "fileUrl": "/files/fil_002/ver_001",
      "createdAt": "2026-01-19T18:30:00Z"
    }
  }
}
```

---

### GET /api/files/{fileId}

Return file details, current version, comments, and approval history.

**Response**

```json
{
  "ok": true,
  "data": {
    "file": {
      "id": "fil_001",
      "name": "requirements.docx",
      "status": "CHANGES_REQUESTED",
      "currentVersion": 2
    },
    "currentVersion": {
      "id": "ver_002",
      "versionNumber": 2,
      "fileUrl": "/files/fil_001/ver_002",
      "createdAt": "2026-01-19T16:40:00Z"
    },
    "comments": [
      {
        "id": "cmt_001",
        "versionId": "ver_002",
        "authorId": "usr_001",
        "body": "Please clarify section 3.",
        "createdAt": "2026-01-19T17:00:00Z"
      }
    ],
    "approvalHistory": [
      {
        "fromStatus": "PENDING_REVIEW",
        "toStatus": "CHANGES_REQUESTED",
        "changedBy": "usr_001",
        "changedAt": "2026-01-19T17:05:00Z"
      }
    ]
  }
}
```

---

## 4. File Versioning

### POST /api/files/{fileId}/versions

Upload a revised version of a file.

**Content-Type:** `multipart/form-data`

**Response**

```json
{
  "ok": true,
  "data": {
    "file": {
      "id": "fil_001",
      "status": "PENDING_REVIEW",
      "currentVersion": 3
    },
    "version": {
      "id": "ver_003",
      "versionNumber": 3,
      "fileUrl": "/files/fil_001/ver_003",
      "createdAt": "2026-01-19T19:10:00Z"
    }
  }
}
```

---

## 5. Comments

### POST /api/files/{fileId}/comments

Create a comment tied to a specific file version.

**Request**

```json
{
  "versionId": "ver_002",
  "body": "Looks good overall."
}
```

**Response**

```json
{
  "ok": true,
  "data": {
    "id": "cmt_002",
    "versionId": "ver_002",
    "authorId": "usr_001",
    "body": "Looks good overall.",
    "createdAt": "2026-01-19T19:20:00Z"
  }
}
```

---

## 6. Approval Workflow

### PATCH /api/files/{fileId}/status

Update approval status for a file.

**Request**

```json
{
  "status": "APPROVED"
}
```

**Response**

```json
{
  "ok": true,
  "data": {
    "fileId": "fil_001",
    "status": "APPROVED",
    "changedBy": "usr_001",
    "changedAt": "2026-01-19T19:25:00Z"
  }
}
```

---

## 7. Admin Overview

### GET /api/admin/overview

Return aggregate file counts by approval status.

**Response**

```json
{
  "ok": true,
  "data": {
    "pendingReview": 12,
    "changesRequested": 5,
    "approved": 20
  }
}
```

---

## Notes

* All file types are supported subject to upload policy and size limits.
* File preview is optional; unsupported types default to download-only access.
* These contracts define the MVP API surface for Sprint 0.
* Endpoints are designed to be unit-tested using mocked dependencies.