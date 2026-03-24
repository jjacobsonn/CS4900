## Use Cases — Vellum (Sprint 0)

This document defines the primary use cases for the Vellum system.
Sprint 0 focuses exclusively on **design and planning**. No use cases are implemented during this sprint.

The use cases below establish a realistic project scope (16–24 total stories) and will guide implementation in future sprints.

---

## UC-01: User Authentication

**Primary Actor:** All Users
**Description:**
A user logs into the system to access Vellum features based on their assigned role.

**Preconditions:**

* User account exists
* User is not currently authenticated

**Main Flow:**

1. User navigates to the login page
2. User enters credentials
3. System validates credentials
4. System issues an authenticated session

**Postconditions:**

* User is logged in
* User is redirected to the asset list view

---

## UC-02: Upload Asset

**Primary Actor:** Designer
**Description:**
A Designer uploads a new creative asset for review.

**Preconditions:**

* User is authenticated as a Designer

**Main Flow:**

1. Designer selects “Upload Asset”
2. Designer selects a file (image or PDF)
3. System stores the asset as version 1
4. System sets asset approval state to “Pending Review”

**Postconditions:**

* Asset appears in the asset list
* Asset has an initial version and approval state

---

## UC-03: View Asset List

**Primary Actor:** All Users
**Description:**
A user views a list of assets accessible to them.

**Preconditions:**

* User is authenticated

**Main Flow:**

1. User navigates to the asset list view
2. System displays assets with current approval states

**Postconditions:**

* User can select an asset to view details

---

## UC-04: View Asset Details

**Primary Actor:** All Users
**Description:**
A user views details for a selected asset.

**Preconditions:**

* User is authenticated
* Asset exists

**Main Flow:**

1. User selects an asset
2. System displays:

   * Current version
   * Approval status
   * Comment history

**Postconditions:**

* User can perform permitted actions (comment, approve, upload revision)

---

## UC-05: Leave Comment on Asset

**Primary Actor:** Reviewer, Designer
**Description:**
A user leaves feedback on a specific asset version.

**Preconditions:**

* User is authenticated
* Asset exists

**Main Flow:**

1. User enters comment text
2. System associates comment with asset version
3. System timestamps and stores the comment

**Postconditions:**

* Comment appears in asset history

---

## UC-06: Update Approval Status

**Primary Actor:** Reviewer, Admin
**Description:**
A Reviewer or Admin updates the approval state of an asset.

**Preconditions:**

* User has Reviewer or Admin role
* Asset exists

**Main Flow:**

1. User selects an approval action:

   * Approve
   * Request Changes
2. System updates the approval state
3. System records the action with user attribution

**Postconditions:**

* Asset approval state is updated and visible

---

## UC-07: Upload Revised Asset Version

**Primary Actor:** Designer
**Description:**
A Designer uploads a new version of an existing asset in response to feedback.

**Preconditions:**

* User is authenticated as a Designer
* Asset exists

**Main Flow:**

1. Designer uploads revised asset
2. System creates a new immutable version
3. System marks the new version as current
4. System sets approval state to “Pending Review”

**Postconditions:**

* Asset version history is updated
* Previous versions remain unchanged

---

## UC-08: Manage Users and Roles

**Primary Actor:** Admin
**Description:**
An Admin manages user accounts and roles.

**Preconditions:**

* User is authenticated as Admin

**Main Flow:**

1. Admin creates or updates a user
2. Admin assigns a role (Designer, Reviewer, Admin)
3. System persists changes

**Postconditions:**

* User permissions are updated according to role

---

## UC-09: View System-Level Asset Status

**Primary Actor:** Admin
**Description:**
An Admin views overall asset status across the system.

**Preconditions:**

* User is authenticated as Admin

**Main Flow:**

1. Admin navigates to system overview
2. System displays asset counts by approval state

**Postconditions:**

* Admin gains visibility into workflow progress

---

## Notes

* These use cases define the minimum viable project scope.
* Each use case implies associated unit tests in future sprints.
* Early sprints will focus on infrastructure and setup use cases (e.g., database initialization, server configuration).
* Later sprints will incrementally implement user-facing workflows.