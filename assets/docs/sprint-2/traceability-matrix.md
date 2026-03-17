## Traceability Matrix — Vellum (Sprint 2)

This matrix links functional requirements (FR-*) to user flows and representative test cases (TC-*).

It is intended to demonstrate coverage and guide future test additions.

---

### 1. Legend

- **FR**: Functional Requirement (from `functional-requirements.md`)
- **Flow**: Section in `user-flows-and-sequences.md`
- **TC**: Test Case (from `test-cases-functional.md`)

---

### 2. Matrix (Representative Entries)

| FR ID   | Description (summary)                                        | Related Flow(s)                                           | Test Case(s)      |
|--------|---------------------------------------------------------------|-----------------------------------------------------------|-------------------|
| FR-1.1 | User authentication                                          | UC-01-like behavior (Authentication, implicit in flows)   | TC-001            |
| FR-1.2 | Enforce RBAC                                                 | All flows involving roles                                 | TC-002            |
| FR-2.2 | Manager creates project                                      | Flow: Create Project and Configure Workflow               | TC-010            |
| FR-2.3 | Project metadata on creation                                 | Flow: Create Project and Configure Workflow               | TC-010            |
| FR-2.5 | Assign users to projects and stages                          | Flow: Create Project and Configure Workflow               | TC-011            |
| FR-3.4 | Select workflow template when creating project               | Flow: Create Project and Configure Workflow               | TC-010            |
| FR-4.1 | Designers create assets                                      | Flow: Designer Creates and Iterates on Assets            | TC-020            |
| FR-4.3 | Upload initial asset version                                 | Flow: Designer Creates and Iterates on Assets            | TC-020            |
| FR-4.6 | Create minor versions                                        | Flow: Designer Creates and Iterates on Assets            | TC-021            |
| FR-4.7 | Create major versions                                        | Flow: Designer Creates and Iterates on Assets            | TC-022            |
| FR-4.9 | Single current version per asset                             | Flow: Designer Creates and Iterates on Assets            | TC-020, TC-021    |
| FR-5.3 | Designer moves to Ready for Internal Review                  | Flow: Designer Creates and Iterates on Assets            | TC-020 (extended) |
| FR-5.4 | Internal Reviewer approves or requests changes               | Flow: Internal Review Loop                               | TC-030, TC-031    |
| FR-5.5 | Client Reviewer approves or requests changes                 | Flow: Client Review and Final Approval                   | TC-040, TC-041    |
| FR-5.6 | Record status changes with attribution and timestamps        | Flows: Internal Review Loop; Client Review; Post-Approval | TC-031, TC-040    |
| FR-6.1 | Comments on asset versions                                   | Flows: Designer Work; Internal Review; Client Review     | TC-030, TC-040    |
| FR-6.3 | Threaded comments with status                                | Flows: Designer Work; Internal Review                    | TC-030 (extended) |
| FR-7.1 | Designer dashboard                                           | Flow: Designer Creates and Iterates on Assets            | TC-050            |
| FR-7.2 | Reviewer dashboard                                           | Flow: Internal Review Loop                               | TC-050            |
| FR-9.1 | Audit history per asset version                              | Flow: Post-Approval Management and Audit                 | TC-060            |
| FR-9.3 | Export approval and status history                           | Flow: Post-Approval Management and Audit                 | TC-060            |

> Note: This table is representative, not exhaustive. New FRs and TCs should be added to this matrix as they are defined and implemented.

