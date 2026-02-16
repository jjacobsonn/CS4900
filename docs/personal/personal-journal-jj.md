# Personal Journal — Jackson Jacobson

**Project:** Vellum - Digital Asset Review & Approval Platform  
**Course:** CS 4900 - Senior Capstone Project  
**Student:** Jackson Jacobson (jjacobsonn)

---

## Sprint 1 - Week 1 (February 10-16, 2026)

### February 16, 2026

**Tasks Completed:**
- Pulled latest changes from main branch
- Created development branch `dev-jj`
- Merged teammate's frontend work (lw-dev branch)
- Created professional documentation structure in `docs/` folder
- Created and tested database setup script (`database/setup.sql`)
- Implemented complete backend structure:
  - Express.js server with PostgreSQL connection
  - User roles API endpoints
  - Service → Database code examples
  - Unit tests with mocked database
- Reorganized frontend into `frontend/` directory
- Connected frontend to backend:
  - Configured Vite proxy
  - Updated login page to fetch roles from backend
  - Demonstrated GUI → Service → Database flow
- Updated all documentation for Sprint 1 Review

**Challenges:**
- Initial Jest configuration issue with ES modules (resolved)
- Coordinating frontend/backend integration
- Ensuring normalized database structure per requirements

**Accomplishments:**
- Full-stack application working end-to-end
- Database properly normalized with lookup tables
- Code examples demonstrating all required patterns
- Professional project structure

**Next Steps:**
- Prepare for Sprint 1 Review presentation
- Address any feedback from review team
- Plan Sprint 2 features (authentication, additional endpoints)

**Reflections:**
Successfully transitioned from planning to implementation. We have a working full-stack application with database integration that exceeds Sprint 1 requirements. The foundation is solid for building out additional features in Sprint 2.

---

## Sprint 1 - Individual Tasks

### Completed Tasks
- [x] Repository setup and branch management
- [x] Documentation review and organization
- [x] Project Follow-up document creation
- [x] Personal Journal setup
- [x] Database setup script (SQL) - created and tested
- [x] README update with setup instructions
- [x] Backend project initialization
- [x] Basic Express server setup
- [x] Database connection implementation
- [x] Initial unit tests
- [x] Code examples for review
- [x] Frontend-backend integration
- [x] Sprint 1 Review preparation

---

## Notes & Observations

- The project uses PostgreSQL as the database (per architecture doc)
- Need to create normalized lookup tables for roles and approval statuses
- Team coordination will be important as we start implementing features
- Testing infrastructure needs to be set up early to support TDD approach

---

**Last Updated:** February 16, 2026
