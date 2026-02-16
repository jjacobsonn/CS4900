## Architectural Stack — Vellum

This document describes the high-level architecture and technology stack used by the Vellum system.  
All architectural decisions are driven by the system’s goals of speed, mobile-first usability, structured approval workflows, and maintainability.

---

## 1. Architecture Overview

Vellum follows a **client–server architecture** with clear separation of concerns:

- **Frontend:** Mobile-first web client  
- **Backend:** RESTful API  
- **Database:** Relational database for structured data  
- **Authentication:** Token-based authentication with role-based access control  

This architecture supports incremental development, testability, and future scalability.

---

## 2. Frontend Layer

**Technology:** React (mobile-first web application)

**Responsibilities:**
- Render user interfaces for file review workflows
- Display approval state, comments, and version history
- Handle user interactions for upload, feedback, and approval

**Justification:**
- React supports component-based UI development and rapid iteration
- Well-suited for mobile-first, responsive interfaces
- Clean separation between presentation and business logic
- Industry-standard frontend framework used in large-scale systems

---

## 3. Backend Layer

**Technology:** Node.js with Express

**Responsibilities:**
- Expose RESTful API endpoints
- Enforce authentication and role-based authorization
- Implement business logic for file versioning and approval workflows
- Coordinate persistence of files, comments, and approval state

**Justification:**
- Express enables a lightweight, fast API layer aligned with the system’s “anti-bloat” philosophy
- Node.js supports asynchronous I/O for responsive user interactions
- Clear mapping between API endpoints and use cases

---

## 4. API Design

**Style:** RESTful JSON APIs

**Characteristics:**
- Stateless requests
- Explicit resource-oriented endpoints (users, files, versions, comments)
- Consistent request and response formats

**Justification:**
- REST aligns naturally with the system’s use cases
- Simplifies testing with mocked dependencies
- Easily consumed by web and mobile clients

---

## 5. Authentication and Authorization

**Technology:** JSON Web Tokens (JWT)

**Responsibilities:**
- Authenticate users
- Enforce role-based access control (RBAC)

**Roles Supported:**
- Designer / Contributor  
- Creative Reviewer  
- Admin / Project Owner  

**Justification:**
- JWT provides stateless authentication suitable for REST APIs
- RBAC enforces clear responsibility boundaries
- Authorization rules are enforced at the API layer for security and consistency

---

## 6. Data Persistence Layer

**Technology:** Relational Database (PostgreSQL)

**Responsibilities:**
- Persist users, files, file versions, comments, and approval states
- Enforce data integrity and relationships
- Maintain immutable historical records

**Justification:**
- Structured approval state and versioning benefit from relational modeling
- Supports strong consistency guarantees
- Enables clear auditability and traceability

---

## 7. File Storage

**Technology:** Local file storage (initial implementation)

**Responsibilities:**
- Store uploaded files of various supported types (documents, images, archives, text/code)

**Justification:**
- Simple and sufficient for MVP and local development
- Architecture allows migration to object storage (e.g., S3) in future iterations without major redesign

---

## 8. Testing Architecture

**Approach:** White-box unit testing with mocked dependencies

**Characteristics:**
- Business logic tested independently of infrastructure
- Database interactions mocked
- Controllers tested without live HTTP or database connections

**Justification:**
- Aligns with Sprint 0 testing requirements
- Enables fast, reliable test execution
- Supports test-driven development (TDD) practices in later sprints

---

## 9. Deployment Model (Initial)

**Environment:**
- Local development environment
- Configuration via environment variables

**Justification:**
- Supports rapid iteration during early development
- Avoids hardcoded secrets
- Provides a clean path to future cloud deployment

---

## Notes

- This architecture prioritizes clarity, testability, and performance over premature optimization.
- Each layer can evolve independently as system requirements grow.
- Architectural decisions align directly with the system’s functional and non-functional requirements.