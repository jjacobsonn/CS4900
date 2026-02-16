## User Acceptance Test Plan — Black Box (UAT)

This document defines the User Acceptance Test (UAT) plan for the Vellum system.
Black-box testing validates that the system behaves correctly from a user’s perspective, without knowledge of internal implementation details.

The goal of this plan is to verify that all defined use cases are implemented correctly and that the system meets the Minimum Viable Project (MVP) requirements.

---

## 1. Testing Scope

* Tests are executed through the user interface and public API behavior
* No knowledge of internal code, database schema, or architecture is required
* Tests validate observable system behavior only
* All primary user roles are covered:

  * Designer
  * Reviewer
  * Admin

---

## 2. Test Environment

* Application running in a local or hosted environment
* Clean test database with seeded user accounts
* File uploads enabled
* Supported file types available for testing (PDF, DOCX, CSV, code file)

---

## 3. Test Accounts

| Role     | Email                                               | Password     |
| -------- | --------------------------------------------------- | ------------ |
| Admin    | [admin@vellum.test](mailto:admin@vellum.test)       | TestPass123! |
| Designer | [designer@vellum.test](mailto:designer@vellum.test) | TestPass123! |
| Reviewer | [reviewer@vellum.test](mailto:reviewer@vellum.test) | TestPass123! |

---

## 4. User Acceptance Test Scenarios

### UAT-01: Admin Login

**Actor:** Admin

**Steps:**

1. Navigate to the login page
2. Enter Admin credentials
3. Submit login form

**Expected Result:**

* Admin is authenticated
* Admin is redirected to the system dashboard

---

### UAT-02: Designer Uploads a New File

**Actor:** Designer

**Steps:**

1. Log in as Designer
2. Navigate to the file list view
3. Upload a new file (e.g., DOCX or CSV)
4. Submit upload

**Expected Result:**

* File appears in the file list
* File approval status is set to “Pending Review”
* File version is set to version 1

---

### UAT-03: Reviewer Views File and Leaves Comment

**Actor:** Reviewer

**Steps:**

1. Log in as Reviewer
2. Navigate to the file list
3. Select the uploaded file
4. Leave a comment on the current version

**Expected Result:**

* Comment is displayed in the file’s comment history
* Comment is associated with the correct file version

---

### UAT-04: Reviewer Requests Changes

**Actor:** Reviewer

**Steps:**

1. While viewing a file, select “Request Changes”
2. Confirm the action

**Expected Result:**

* File approval status changes to “Changes Requested”
* Approval history records the status change

---

### UAT-05: Designer Uploads Revised Version

**Actor:** Designer

**Steps:**

1. Log in as Designer
2. Navigate to the file with requested changes
3. Upload a revised version of the file

**Expected Result:**

* New file version is created
* New version is marked as current
* Approval status resets to “Pending Review”
* Previous versions remain accessible

---

### UAT-06: Reviewer Approves File

**Actor:** Reviewer

**Steps:**

1. Log in as Reviewer
2. Open the revised file
3. Select “Approve”

**Expected Result:**

* File approval status changes to “Approved”
* Approval history records the approval action

---

### UAT-07: Admin Manages Users

**Actor:** Admin

**Steps:**

1. Log in as Admin
2. Navigate to user management
3. Create a new user or update an existing user’s role

**Expected Result:**

* User account is created or updated successfully
* Role changes take effect immediately

---

### UAT-08: Role-Based Access Enforcement

**Actor:** Designer

**Steps:**

1. Log in as Designer
2. Attempt to approve a file

**Expected Result:**

* Action is denied
* System displays an authorization error

---

### UAT-09: System Overview (Admin)

**Actor:** Admin

**Steps:**

1. Log in as Admin
2. Navigate to system overview

**Expected Result:**

* System displays counts of files by approval status
* Data reflects current system state accurately

---

## 5. Acceptance Criteria

The system is considered acceptable when:

* All test scenarios pass
* Approval workflows behave as defined
* Role-based access rules are enforced
* File versioning and approval state remain consistent
* A user unfamiliar with the system can follow this script and complete all tests successfully

---

## 6. Notes

* This UAT plan serves as both a validation checklist and a demo script.
* Black-box testing complements, but does not replace, white-box unit testing.
* Any failure in these tests indicates that MVP requirements have not been met.