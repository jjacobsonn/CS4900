<a name="top"></a>

<div align="center">

<img src="assets/images/logo.png" alt="Vellum Logo" width="150"/>

**Fast, Mobile-First Digital Asset Review & Approval Platform**

[![React](https://img.shields.io/badge/React-18.0+-61DAFB?logo=react&logoColor=white)](assets/documentation/achitecture.md)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](assets/documentation/achitecture.md)
[![Mobile First](https://img.shields.io/badge/Mobile-First-4285F4?logo=google&logoColor=white)](assets/documentation/nonfunctional-requirements.md)
[![Role Based](https://img.shields.io/badge/RBAC-Enabled-FF6B6B)](assets/documentation/functional-requirements.md)
[![Fast](https://img.shields.io/badge/Load_Time-%3C2s-00D084)](assets/documentation/nonfunctional-requirements.md)
[![License](https://img.shields.io/badge/License-Academic-blue)](LICENSE)

</div>

---

## Table of Contents
- [About](#about)
- [Key Features](#key-features)
- [Documentation](#documentation)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Team](#project-team)
- [License](#license)

---

## About

**Vellum** is a fast, mobile-first digital asset review and approval platform designed for teams that prioritize speed and clarity over bloated tooling. It treats approval as **structured system data** rather than informal comments, enabling clear approval states, auditable decisions, and predictable workflows.

Vellum provides lightweight, role-aware creative reviews optimized for real-world usage, especially on mobile devices, without the complexity or cost of traditional enterprise solutions.

### Why Vellum?

- **Mobile-First:** Complete workflows in 3 taps or fewer on any device
- **Structured Approvals:** Clear approval states, not just comments
- **Role-Based:** Designer, Reviewer, and Admin roles with proper access control
- **Fast:** File lists load in under 2 seconds, approval actions complete in 500ms
- **Anti-Bloat:** Lightweight architecture without enterprise complexity

---

## Key Features

**Structured Approval Workflow**
- Clear approval states (Pending, Approved, Changes Requested)
- Auditable decision history
- Role-based approval permissions

**Mobile-First Design**
- Complete review workflows on mobile devices
- Responsive UI optimized for touch interactions
- Fast load times on mobile networks

**Role-Based Access Control**
- **Designer/Contributor:** Upload files and track approval status
- **Creative Reviewer:** Review files, provide feedback, approve/request changes
- **Admin/Project Owner:** Manage users, roles, and project settings

**Multi-Format File Support**
- Images, PDFs, Office documents
- Text, code files, CSV, JSON
- Archive files (ZIP) and more

**Contextual Feedback**
- Comment on files with approval context
- Version history tracking
- Clear visual approval indicators

---

## Documentation

### Core Documentation

- **[Elevator Pitch](assets/documentation/elevator-pitch.md)** - Project vision and value proposition
- **[Architecture](assets/documentation/achitecture.md)** - System architecture and technology stack
- **[Functional Requirements](assets/documentation/functional-requirements.md)** - Core system capabilities
- **[Non-Functional Requirements](assets/documentation/nonfunctional-requirements.md)** - Performance, usability, and quality metrics

### Design & Planning

- **[Personas](assets/documentation/personas.md)** - User personas and target audience
- **[Use Cases](assets/documentation/use-cases.md)** - Key user scenarios and workflows
- **[Figma Wireframes](assets/documentation/figma-wireframe.md)** - UI/UX design mockups
- **[Sequence Diagrams](assets/documentation/sequence-diagrams.md)** - System interaction flows

### Technical Specifications

- **[API JSON Contracts](assets/documentation/api-json-contracts.md)** - RESTful API endpoint specifications
- **[Database Diagram](assets/documentation/database-diagram.md)** - Database schema and relationships

### Testing

- **[Testing Plan (Whitebox)](assets/documentation/testing-plan-whitebox.md)** - Unit and integration testing strategy
- **[User Acceptance Test Plan](assets/documentation/user-acceptance-test-plan.md)** - UAT scenarios and acceptance criteria

### Project Management

- **[Project Follow-up](docs/project-management/project-follow-up.md)** - Sprint review and status tracking
- **[Schedule](docs/project-management/schedule.md)** - Project timeline and milestones
- **[Sprint 1 Review Checklist](docs/project-management/sprint1-review-checklist.md)** - Review preparation checklist

---

## Tech Stack

**Frontend**
- React (mobile-first web application)
- Component-based UI architecture
- Responsive design for all screen sizes

**Backend**
- Node.js with Express
- RESTful API architecture
- Token-based authentication

**Database**
- PostgreSQL (relational database)
- Optimized for approval workflow queries

**Authentication & Authorization**
- Role-Based Access Control (RBAC)
- Secure token-based authentication
- Three-tier permission system

---

## Getting Started

This guide will walk you through setting up the Vellum development environment from scratch.

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)
- **npm** (comes with Node.js) or **yarn**

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/jjacobsonn/CS4900.git

# Navigate to project directory
cd CS4900
```

### Step 2: Install Dependencies

```bash
# Install backend dependencies (when backend is initialized)
cd backend
npm install

# Install frontend dependencies (when frontend is initialized)
cd ../frontend
npm install
```

### Step 3: Set Up PostgreSQL Database

#### 3.1 Create Database

Using PostgreSQL command line (`psql`):

```bash
# Connect to PostgreSQL (as superuser or database owner)
psql -U postgres

# Create the database
CREATE DATABASE vellum;

# Connect to the new database
\c vellum;
```

Or using a GUI tool like pgAdmin:
1. Open pgAdmin
2. Right-click on "Databases"
3. Select "Create" → "Database"
4. Name it `vellum`
5. Click "Save"

#### 3.2 Run Database Setup Script

From the project root directory:

```bash
# Using psql command line
psql -U postgres -d vellum -f database/setup.sql

# Or if already connected to vellum database in psql:
\i database/setup.sql
```

The setup script will:
- Create all required tables (users, files, file_versions, comments, approval_history)
- Create normalized lookup tables (user_roles, approval_statuses)
- Insert default/initial records (roles and statuses)
- Create indexes for performance
- Set up triggers for automatic timestamp updates

#### 3.3 Verify Database Setup

```bash
# Connect to database
psql -U postgres -d vellum

# Verify tables were created
\dt

# Verify lookup data was inserted
SELECT * FROM user_roles;
SELECT * FROM approval_statuses;
```

### Step 4: Configure Environment Variables

Create a `.env` file in the backend directory (create `.env.example` first if it doesn't exist):

```bash
# Backend .env file
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vellum
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret (generate a secure random string)
JWT_SECRET=your_jwt_secret_key_here

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes
```

### Step 5: Start Server Components

#### 5.1 Start PostgreSQL (if not running)

**macOS:**
```bash
brew services start postgresql
# or
pg_ctl -D /usr/local/var/postgres start
```

**Linux:**
```bash
sudo systemctl start postgresql
```

**Windows:**
PostgreSQL typically runs as a service automatically.

#### 5.2 Start Backend Server

```bash
# Navigate to backend directory
cd backend

# Start development server
npm run dev
# or
npm start
```

Backend API will be available at: **http://localhost:3000/api**

#### 5.3 Start Frontend Development Server

```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Start React development server
npm start
```

Frontend GUI will be available at: **http://localhost:3001**

### Step 6: Verify Installation

1. **Database:** Verify tables exist and lookup data is populated
2. **Backend:** Check that server starts without errors
3. **Frontend:** Verify React app loads in browser
4. **API Connection:** Test API endpoints (when implemented)

### Default URLs

- **Backend API:** http://localhost:3000/api
- **Frontend GUI:** http://localhost:3001
- **API Documentation:** http://localhost:3000/api/docs (when implemented)

### Troubleshooting

**Database Connection Issues:**
- Verify PostgreSQL is running: `pg_isready` or `psql -U postgres -c "SELECT 1;"`
- Check database credentials in `.env` file
- Ensure database `vellum` exists

**Port Already in Use:**
- Change `PORT` in `.env` file
- Or stop the process using the port: `lsof -ti:3000 | xargs kill`

**Module Not Found Errors:**
- Run `npm install` in both backend and frontend directories
- Delete `node_modules` and `package-lock.json`, then reinstall

For detailed architecture information, see the [Architecture documentation](assets/documentation/achitecture.md).

---

## Project Team

**Course:** CS 4900 - Senior Capstone Project  
**Institution:** Utah Valley University  
**Term:** Spring 2026

This project is being developed as part of the UVU Computer Science capstone program.

---

## Feedback and Contributions

We're continuously improving Vellum based on real-world usage and feedback. Whether you have suggestions for features, have encountered bugs, or want to contribute to the codebase, we'd love to hear from you.

Please feel free to:
- [Submit an issue](https://github.com/jjacobsonn/CS4900/issues)
- [Start a discussion](https://github.com/jjacobsonn/CS4900/discussions)
- Submit a pull request

---

## License

This project is developed for academic purposes as part of the UVU CS 4900 capstone course.

---

**Vellum** — Approval workflows, reimagined for mobile.

[Back to top](#top)
