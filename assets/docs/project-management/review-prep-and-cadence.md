# Review Prep & Cadence — What’s Needed Each Cycle

**Project:** Vellum  
**Course:** CS 4900 — Senior Capstone Project  
**Term:** Spring 2026

**Sprint 2 purpose:** The purpose of Sprint 2 (and each sprint) is to **fulfill the four-week review process**. Use **[Sprint 2 Purpose & Review Requirements](../sprint-2/SPRINT-2-PURPOSE-AND-REVIEW-REQUIREMENTS.md)** as the master checklist so **everything** required for each review is done.

---

## 1. Review cadence

- **Four-week follow-up:** The project review team meets every **four weeks**.
- **Meeting dates:** **3rd Wednesday of each month** (sprint review), plus the **course final exam date/time** for the Final Review. Preferably everyone meets at once to review all projects.
- **Your responsibility:** Keep documentation up to date for **each individual**: Personal Journal, Schedule, Individual Tasks each sprint end, and the Project Follow-up document.

---

## 2. Documentation you must keep up to date

| Document | Who | When |
|----------|-----|------|
| **Personal Journal** | Each team member | Ongoing; update before each review |
| **Schedule** (`schedule.md`) | Team | Before each review — mark items completed |
| **Project Follow-up** (`project-follow-up.md`) | Team | Before each review — see section 3 below |
| **Individual tasks per sprint** | Each team member | At each sprint end (in Schedule and/or Personal Journal) |

---

## 3. Before each review meeting (every 3rd Wednesday)

Each individual should do the following **before** the meeting:

1. **Update your Project Journal(s)**  
   - File: `assets/docs/personal/personal-journal-<your-initials>.md`  
   - Add an entry for the current sprint: tasks completed, challenges, next steps.

2. **Update the Schedule**  
   - File: `assets/docs/project-management/schedule.md`  
   - Mark completed items with `[x]`.  
   - Update “Individual Task Tracking” for your tasks.  
   - Keep “Review Meeting Dates” and “Key Deliverables” accurate.

3. **Update the Project Follow-up document**  
   - File: `assets/docs/project-management/project-follow-up.md`  
   - Fill in (or refresh):
     - **Current Date** — date of the review (e.g. 3rd Wednesday).
     - **Schedule Status** — overall timeline and current sprint status.
     - **Items or milestones completed this past sprint** — what the team actually finished.
     - **Red flags or important issues** — anything that needs discussion (blockers, scope, timeline, tech issues).

---

## 4. During the review meeting (capture in Project Follow-up)

The group should add to **Project Follow-up** during or right after the meeting:

- **Code Review Notes** — feedback on code structure, patterns, tests, etc.
- **Action Items to be completed as a result of review** — concrete tasks and owners.
- **Additional notes or suggestions made by review group** — any other decisions or follow-ups.

---

## 5. Sprint review checklist (from course — apply to every sprint)

Use this for **each** sprint review (and the final). Full checklist: **[Sprint 2 Purpose & Review Requirements](../sprint-2/SPRINT-2-PURPOSE-AND-REVIEW-REQUIREMENTS.md)**.

### Setup & installation (README steps)

- [ ] Download and install any necessary tools.
- [ ] Download and install any necessary dependencies.
- [ ] Start server components (DB, web server, app server) in the **correct bootstrap order** (if dependencies exist).
- [ ] Invoke SQL/NoSQL script: **create new database/schema**, **explicitly use** that schema, **create tables**, **create default/initial records** (normalized lookup data — e.g. id + description tables, not free-form strings).
- [ ] Provide **link to default URL for loading services** and **link to default URL for loading the GUI**.

### Code review (brief)

- [ ] Example code: **services connect to the database**.
- [ ] Example code: **GUI invoking services**.

### Unit tests

- [ ] (a) Classes
- [ ] (b) Business logic
- [ ] (c) Mock DB for testing web services
- [ ] (d) Mock web service for testing the GUI

### Demo

- [ ] Demo **newly functioning facets**, including **bug fixes**, since last sprint.
- [ ] Explain **deficiencies**, **known bugs**, etc.
- [ ] **Actual status** vs **originally planned status** — if different, whether better or worse and **why**.

---

## 6. Review meeting dates (reference)

| Review | 3rd Wednesday | Type |
|--------|----------------|------|
| Sprint 1 | Feb 19, 2026 | Monthly |
| Sprint 2 | Mar 19, 2026 | Monthly |
| Sprint 3 | Apr 16, 2026 | Monthly |
| Sprint 4 | May 21, 2026 | Monthly |
| Final | Course final exam date/time | Final Review |

*(Confirm exact dates with syllabus; 3rd Wednesday may shift by month.)*

---

## 7. What to do *right now* (before next 3rd Wednesday)

**Goal:** Make sure **everything** required for the review is done. Cross-check against **[Sprint 2 Purpose & Review Requirements](../sprint-2/SPRINT-2-PURPOSE-AND-REVIEW-REQUIREMENTS.md)**.

- [ ] **Personal journal** — You added Feb 23 re-implementation; before the *next* review, add another entry for the sprint that just ended.
- [ ] **Schedule** — Mark any remaining completed items (e.g. re-implementation Phase 0/1, doc updates); update “Individual Task Tracking” for each person.
- [ ] **Project Follow-up** — Set **Current Date** to the next review date; under “Items or milestones completed this past sprint” add re-implementation (Phase 0 & 1) and any other work; update “Red flags”; leave “Code Review Notes” and “Action Items” for the meeting.
- [ ] **Sprint review checklist** — Walk through section 5 above for the upcoming review (setup, code examples, tests, demo, status vs plan).
- [ ] **Optional:** Create or update `sprint-<n>-review-summary.md` after the meeting for that sprint.

---

**Last updated:** February 2026
