# Sprint 2 Purpose: Four-Week Review Compliance

**Sprint 2’s purpose is to fulfill the course’s four-week project review process.**  
Use this doc to confirm that **everything required** for each review is being done.

---

## 1. What the course requires (four-week follow-up)

You will follow up with your project review team **every four weeks**. Meetings are:

- **3rd Wednesday of each month** (sprint review)
- **Date/time of the final exam** for this class (Final Review)

**Preferably**, everyone meets at once and reviews all projects.

**You are responsible** for ensuring documentation is up to date for **each individual**:

| Document | Responsibility |
|----------|----------------|
| **Personal Journal** | Each individual |
| **Schedule** | Team (mark items completed) |
| **Individual Tasks Each Sprint End** | Each individual |
| **Project Follow-up** | Team (see section 2) |

---

## 2. Before each review meeting (each individual)

Each individual must prepare **before** the meeting:

1. **Update your Project Journal(s)**
2. **Update your Schedule** — mark items completed
3. **Update the Project Follow-up document** in your project folder with:
   - **Current Date**
   - **Schedule Status**
   - **Items or milestones completed this past sprint**
   - **Red Flags or Important Issues** you need to discuss

*(Example: [Project Follow-up](https://docs.google.com/document/d/1gL2c2xRqM3n5n5n5n5n5n5n5n5n5n5n5n5n/edit) — use our project’s `assets/docs/project-management/project-follow-up.md`.)*

---

## 3. During the review meeting (add to Project Follow-up)

During or right after the review meeting, add to **Project Follow-up**:

- **Code Review Notes**
- **Action Items** to be completed as a result of review
- **Additional notes or suggestions** made by the review group

---

## 4. Sprint 1 Review criteria (apply to every sprint)

For **each** sprint review (and the final), the team must be able to do the following. Use this as the **master checklist** so everything is being done.

### 4.1 Setup & installation (using README steps)

- [ ] Download and install any necessary tools
- [ ] Download and install any necessary dependencies
- [ ] Start server components (including databases, web server, app server, etc.) in the **correct, bootstrap order** (if there are dependencies)
- [ ] Invoke SQL/NoSQL script to create the basic database  
  - Script can use a database-specific CLI (e.g. MySQL Console, Mongo Shell); it doesn’t need to be an OS batch/shell script.  
  - Script **must** include:
  - [ ] **Create new Database/Schema**
  - [ ] **Explicitly use the new Schema** after creating it
  - [ ] **Create any Tables**
  - [ ] **Create any Default/Initial Records** (e.g. descriptions/categorizations for normalization — e.g. lookup tables like account types with id + description, not free-form strings; use foreign keys for reporting)
- [ ] Provide a link to the **default URL for loading services**
- [ ] Provide a link to the **default URL for loading the GUI**

### 4.2 Code review (brief)

- [ ] Briefly review **example code** showing how **services connect to the database**
- [ ] Briefly review **example code** of **GUI invoking services**

### 4.3 Unit tests

- [ ] **(a)** Unit tests for **classes**
- [ ] **(b)** Unit tests for **business logic**
- [ ] **(c)** **Mock DB** for testing web services
- [ ] **(d)** **Mock web service** for testing the GUI

### 4.4 Demo

- [ ] Demo of **newly functioning facets**, including **bug fixes**, of the website (since last sprint)
- [ ] Explanation of any **deficiencies**, **known bugs**, etc.
- [ ] **Actual status** compared to **originally planned status** — if different, whether better or worse, and **why**?

---

## 5. Making sure everything is being done

| Area | Where to check | Action |
|------|----------------|--------|
| **Before-meeting prep** | [Review Prep & Cadence](../project-management/review-prep-and-cadence.md) | Each person: journal, schedule, project follow-up updated |
| **Project Follow-up** | [Project Follow-up](../project-management/project-follow-up.md) | Current date, schedule status, completed items, red flags; after meeting: code review notes, action items, suggestions |
| **Schedule & tasks** | [Schedule](../project-management/schedule.md) | Mark completed; individual task tracking per person |
| **README setup steps** | [README.md](../../README.md) | Steps must match this checklist (tools, deps, DB script, start order, URLs) |
| **DB script** | `database/setup.sql` | Create DB/schema, use schema, tables, default/normalized records |
| **Code examples** | Backend services + frontend API calls | Service→DB; GUI→services |
| **Tests** | Backend + frontend test dirs | (a) classes (b) business logic (c) mock DB for API (d) mock API for GUI |
| **Demo & status** | Project Follow-up “Known deficiencies” / “Status comparison” | Demo new features; explain gaps; actual vs planned |

---

## 6. Review meeting dates (reference)

| Review | Date | Type |
|--------|------|------|
| Sprint 1 | Feb 19, 2026 (3rd Wednesday) | Monthly |
| Sprint 2 | Mar 19, 2026 (3rd Wednesday) | Monthly |
| Sprint 3 | Apr 16, 2026 (3rd Wednesday) | Monthly |
| Sprint 4 | May 21, 2026 (3rd Wednesday) | Monthly |
| Final | Course final exam date/time | Final Review |

*Confirm with syllabus; 3rd Wednesday may vary by month.*

---

## 7. Links to project docs

- **Project Follow-up:** [project-follow-up.md](../project-management/project-follow-up.md)
- **Schedule:** [schedule.md](../project-management/schedule.md)
- **Review prep & cadence:** [review-prep-and-cadence.md](../project-management/review-prep-and-cadence.md)
- **Sprint 1 review checklist:** [sprint1-review-checklist.md](../project-management/sprint1-review-checklist.md)
- **README (setup steps):** [README.md](../../README.md)

---

**Last updated:** February 2026
