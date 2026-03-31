## Test Strategy — Vellum (Sprint 2)

This document defines the testing approach for Vellum in Sprint 2 and explains how tests map to the updated functional and non-functional requirements.

It covers unit, integration, end-to-end (E2E), and user acceptance testing (UAT).

---

### 1. Testing Goals

- Validate that the expanded workflows, roles, and versioning behave as specified in:
  - [functional-requirements.md](../requirements/functional-requirements.md)
  - [nonfunctional-requirements.md](../requirements/nonfunctional-requirements.md)
  - [user-flows-and-sequences.md](../requirements/user-flows-and-sequences.md)
- Ensure critical business logic (permissions, versioning, workflow transitions) is robust and regression-resistant.
- Provide enough coverage that future changes can be made confidently.

---

### 2. Test Levels

#### 2.1 Unit Tests

**Scope:**

- Pure business logic and domain rules, including:
  - Versioning (major/minor increments, current version selection).
  - Workflow state transitions (allowed transitions per role and stage).
  - Permission checks (who can do what at a given stage).

**Characteristics:**

- Run in isolation from external systems (no database, network, or filesystem).
- Use mocks or in-memory implementations for dependencies.
- Fast to execute and suitable for CI.

#### 2.2 Integration Tests

**Scope:**

- Backend API endpoints and their interaction with the database and persistence layer:
  - Creating projects, assets, and versions.
  - Moving versions through workflow stages.
  - Commenting and approvals.

**Characteristics:**

- Use a real or test database (e.g., ephemeral or in-memory).
+- Verify that API contracts (`api-and-contracts` documentation) are satisfied.
- Validate error handling and edge cases that depend on persistence.

#### 2.3 End-to-End (E2E) Tests

**Scope:**

- High-level flows across frontend and backend:
  - Manager creates project and assigns roles.
  - Designer uploads versions and moves status.
  - Internal Reviewer and Client Reviewer complete review and approval.

**Characteristics:**

- Use a browser automation framework (e.g., Playwright, Cypress) or equivalent.
- Operate against a running instance of the application in a test environment.
- Focus on critical happy paths and a few key edge cases.

#### 2.4 User Acceptance Testing (UAT)

**Scope:**

- Manual testing guided by:
  - Personas and primary flows from `user-flows-and-sequences.md`.
  - UAT scenarios in `uat-plan-and-scenarios.md` (future/optional file).

**Characteristics:**

- Performed by stakeholders (e.g., product owner, instructor, or QA).
- Validates that the system meets business goals and user expectations.

---

### 3. Test Coverage Priorities

Given limited time and resources, testing should prioritize:

1. **Permissions and Roles**
   - Only authorized roles can perform critical actions (e.g., approvals, project creation).
2. **Versioning and Status Transitions**
   - Versions are immutable, current version pointer is correct, and state transitions obey the rules.
3. **Core Flows**
   - End-to-end creation, review, approval, and publication of assets within a project.

Less critical areas (e.g., advanced filtering, secondary UI niceties) may have lighter coverage initially but can be expanded in later sprints.

---

### 4. Environments and Tooling

**Local Development:**

- Developers run unit tests and a subset of integration tests locally.
- E2E tests may be run locally as needed during development.

**Continuous Integration (CI):**

- On each push or pull request:
  - Run all unit tests.
  - Run a targeted set of integration tests.
  - Optionally run a small “smoke” subset of E2E tests.

**Tools (examples, to be adjusted based on tech stack):**

- Unit/Integration:
  - Node.js: Jest or Vitest for backend and frontend logic.
- E2E:
  - Playwright or Cypress for UI flows.

Specific tools shall be documented in the project’s `README` and test configuration.

---

### 5. Mapping Requirements to Tests

Mapping is captured in [test-cases-functional.md](./test-cases-functional.md) and [traceability-matrix.md](../requirements/traceability-matrix.md):

- Each functional requirement (e.g., FR-5.3) corresponds to one or more test cases.
- Each test case specifies:
  - Test ID (e.g., TC-005).
  - Requirement IDs covered.
  - Test level (unit, integration, E2E, UAT).

This ensures traceability from specifications to implemented tests.

---

### 6. Test Data and Fixtures

To keep tests reliable and maintainable:

- Use deterministic, minimal fixtures:
  - Example organization, clients, projects, users, and roles.
  - A small set of assets and versions representing typical cases.
- Prefer factory or builder functions for creating domain objects in tests.
- Isolate test data per test (e.g., via database transactions or sandboxing).

---

### 7. Regression Testing

- When a bug is discovered, add a regression test that reproduces the issue before fixing it.
- Ensure regression tests are linked to the corresponding requirements in [traceability-matrix.md](../requirements/traceability-matrix.md).

---

### 8. Exit Criteria for Sprint 2

For Sprint 2, the following criteria indicate acceptable test readiness:

- All high-priority functional requirements (core flows, permissions, versioning) have at least one passing test case.  
- All unit and integration test suites pass in CI.  
- A minimal set of E2E tests covering the main “happy path” flows are passing:
  - Project creation and configuration.
  - Asset creation and internal review.
  - Client review and final approval.
- UAT has been performed for at least one end-to-end scenario per primary persona (Manager, Designer, Internal Reviewer, Client Reviewer).

