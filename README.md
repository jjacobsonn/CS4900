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
- [About](#-about)
- [Key Features](#-key-features)
- [Documentation](#-documentation)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Team](#-project-team)
- [License](#-license)

---

## 🚀 About

**Vellum** is a fast, mobile-first digital asset review and approval platform designed for teams that prioritize speed and clarity over bloated tooling. It treats approval as **structured system data** rather than informal comments, enabling clear approval states, auditable decisions, and predictable workflows.

Vellum provides lightweight, role-aware creative reviews optimized for real-world usage, especially on mobile devices, without the complexity or cost of traditional enterprise solutions.

### Why Vellum?

- **Mobile-First:** Complete workflows in 3 taps or fewer on any device
- **Structured Approvals:** Clear approval states, not just comments
- **Role-Based:** Designer, Reviewer, and Admin roles with proper access control
- **Fast:** File lists load in under 2 seconds, approval actions complete in 500ms
- **Anti-Bloat:** Lightweight architecture without enterprise complexity

---

## ✨ Key Features

🎯 **Structured Approval Workflow**
- Clear approval states (Pending, Approved, Changes Requested)
- Auditable decision history
- Role-based approval permissions

📱 **Mobile-First Design**
- Complete review workflows on mobile devices
- Responsive UI optimized for touch interactions
- Fast load times on mobile networks

👥 **Role-Based Access Control**
- **Designer/Contributor:** Upload files and track approval status
- **Creative Reviewer:** Review files, provide feedback, approve/request changes
- **Admin/Project Owner:** Manage users, roles, and project settings

📂 **Multi-Format File Support**
- Images, PDFs, Office documents
- Text, code files, CSV, JSON
- Archive files (ZIP) and more

💬 **Contextual Feedback**
- Comment on files with approval context
- Version history tracking
- Clear visual approval indicators

---

## 📚 Documentation

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

---

## 🛠 Tech Stack

**Frontend**
- React (mobile-first web application)
- Component-based UI architecture
- Responsive design for all screen sizes

**Backend**
- Node.js with Express
- RESTful API architecture
- Token-based authentication

**Database**
- Relational database (structured data)
- Optimized for approval workflow queries

**Authentication & Authorization**
- Role-Based Access Control (RBAC)
- Secure token-based authentication
- Three-tier permission system

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/vellum.git

# Navigate to project directory
cd vellum

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev
```

For detailed setup instructions, see the [Architecture documentation](assets/documentation/achitecture.md).

---

## 👥 Project Team

**Course:** CS 4900 - Senior Capstone Project  
**Institution:** Utah Valley University  
**Term:** Spring 2026

This project is being developed as part of the UVU Computer Science capstone program.

---

## 🤝 Feedback and Contributions

We're continuously improving Vellum based on real-world usage and feedback. Whether you have suggestions for features, have encountered bugs, or want to contribute to the codebase, we'd love to hear from you.

Please feel free to:
- [Submit an issue](https://github.com/your-username/vellum/issues)
- [Start a discussion](https://github.com/your-username/vellum/discussions)
- Submit a pull request

---

## 📃 License

This project is developed for academic purposes as part of the UVU CS 4900 capstone course.

---

**Vellum** — Approval workflows, reimagined for mobile.

[Back to top](#top)
