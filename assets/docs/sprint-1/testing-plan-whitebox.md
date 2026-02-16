## Testing Plan — White Box (Unit Testing)

This document defines the white-box testing strategy for the Vellum system.
White-box testing focuses on verifying that internal system logic behaves correctly according to the implemented design, independent of external systems.

Testing is performed at the lowest possible layer using unit tests and mocked dependencies.

---

## 1. Testing Philosophy

* Tests verify **how the system is implemented**, not user behavior
* External dependencies (database, file system, HTTP) are **mocked**
* Each layer is tested independently
* Business logic is tested before integration
* Integration testing is explicitly out of scope for Sprint 0

---

## 2. Testing Frameworks

### Backend

* **Test Runner:** Jest
* **Mocking Library:** Jest Mocks
* **HTTP Layer:** Supertest (mocked controllers only)
* **Database Access:** Mocked repository or data access layer

### Frontend (Minimal)

* **Framework:** Jest + React Testing Library
* **Scope:** Basic component rendering and conditional UI logic
* **Note:** Extensive UI testing is intentionally limited due to fragility

---

## 3. Model Layer Tests

Model tests validate data structures and business rules.

### Test Cases

* Default constructor behavior
* Fully parameterized constructor behavior
* Required field validation
* Exception handling for invalid inputs
* Boundary conditions (null, empty, out-of-range values)

### Example Targets

* File
* FileVersion
* Comment
* ApprovalHistory

---

## 4. Business Logic / Service Layer Tests

Service tests validate core system behavior independent of transport or persistence.

### Test Cases

* Creating a new file initializes version 1
* Uploading a new version increments version number
* Exactly one version is marked as current
* Approval state transitions are valid
* Invalid state transitions are rejected
* Approval history is recorded correctly

### Mocking Strategy

* Database calls are mocked
* File storage interactions are mocked
* Services are tested with controlled inputs and outputs

---

## 5. Controller Layer Tests

Controller tests verify request handling and authorization behavior.

### Test Cases

* Valid requests return correct responses
* Invalid input results in validation errors
* Unauthorized users are rejected
* Forbidden actions return appropriate error responses
* Correct service methods are invoked

### Mocking Strategy

* Business logic services are mocked
* No real HTTP server is started
* No database calls are made

---

## 6. Authorization and Security Tests

### Test Cases

* Only authorized roles can perform approval actions
* Admin-only endpoints reject non-admin users
* JWT claims are validated correctly
* Expired or invalid tokens are rejected

---

## 7. Edge Case Testing

Edge case tests validate system robustness.

### Examples

* Empty file uploads
* Unsupported file types
* Duplicate approval requests
* Comments on non-current versions
* Concurrent approval attempts (simulated)

---

## 8. Test Coverage Goals

* All business logic paths covered
* All approval state transitions tested
* All role-based access rules validated
* Error handling paths explicitly tested

---

## 9. Out of Scope

* Integration testing (real DB, real file system)
* End-to-end testing
* Performance testing
* Load testing

These concerns may be addressed in later project phases.

---

## Notes

* This testing plan defines expected testing behavior; tests are not implemented during Sprint 0.
* All tests will be implemented incrementally alongside user stories in future sprints.
* Mocking and dependency injection are core to maintaining fast and reliable tests.
