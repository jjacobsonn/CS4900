-- Vellum Database Setup Script
-- PostgreSQL Database Initialization
-- Course: CS 4900 - Senior Capstone Project
-- Project: Vellum - Digital Asset Review & Approval Platform

-- ============================================================================
-- BOOTSTRAP: Create and connect to database
-- ============================================================================
-- Target DB name comes from psql -v dbname=... (see scripts/db-setup.mjs).
-- If unset, default to vellum so manual runs still work.
\if :{?dbname}
\else
\set dbname vellum
\endif

SELECT format('CREATE DATABASE %I', :'dbname')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'dbname')\gexec
\connect :"dbname"

-- ============================================================================
-- STEP 1: Create Database Schema
-- ============================================================================

-- Drop database if it exists (for clean setup)
-- Note: This command must be run as a superuser or database owner
-- DROP DATABASE IF EXISTS vellum;

-- Create new database
-- Note: This command must be run from psql or as a superuser
-- CREATE DATABASE vellum;
-- \c vellum;  -- Connect to the database (psql command)

-- For this script, we assume we're already connected to the vellum database
-- If running from psql: \c vellum; then run this script

-- ============================================================================
-- STEP 2: Create Lookup Tables (Normalized Data)
-- ============================================================================

-- User Roles Lookup Table
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    role_code VARCHAR(20) NOT NULL UNIQUE,
    description VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- File Approval Status Lookup Table
CREATE TABLE IF NOT EXISTS approval_statuses (
    id SERIAL PRIMARY KEY,
    status_code VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STEP 3: Create Core Tables
-- ============================================================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES user_roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Files Table
CREATE TABLE IF NOT EXISTS files (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    extension VARCHAR(20),
    size_bytes BIGINT,
    status_id INTEGER NOT NULL REFERENCES approval_statuses(id),
    current_version_id INTEGER, -- Will be set after FileVersion is created
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- File Versions Table
CREATE TABLE IF NOT EXISTS file_versions (
    id SERIAL PRIMARY KEY,
    file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(file_id, version_number)
);

-- Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    file_version_id INTEGER NOT NULL REFERENCES file_versions(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(id),
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Approval History Table (Audit Log)
CREATE TABLE IF NOT EXISTS approval_history (
    id SERIAL PRIMARY KEY,
    file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    file_version_id INTEGER NOT NULL REFERENCES file_versions(id) ON DELETE CASCADE,
    from_status_id INTEGER REFERENCES approval_statuses(id),
    to_status_id INTEGER NOT NULL REFERENCES approval_statuses(id),
    changed_by INTEGER NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STEP 4: Add Foreign Key Constraint for current_version_id
-- ============================================================================

-- Add foreign key constraint for current_version_id (must be done after file_versions table exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_files_current_version'
    ) THEN
        ALTER TABLE files
        ADD CONSTRAINT fk_files_current_version
        FOREIGN KEY (current_version_id) REFERENCES file_versions(id);
    END IF;
END $$;

-- ============================================================================
-- STEP 5: Create Indexes for Performance
-- ============================================================================

-- Indexes on foreign keys
CREATE INDEX IF NOT EXISTS idx_files_created_by ON files(created_by);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status_id);
CREATE INDEX IF NOT EXISTS idx_files_current_version ON files(current_version_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_file_id ON file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_comments_file_id ON comments(file_id);
CREATE INDEX IF NOT EXISTS idx_comments_file_version_id ON comments(file_version_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_file_id ON approval_history(file_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_changed_by ON approval_history(changed_by);

-- Indexes on frequently queried fields
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_file_versions_created_at ON file_versions(created_at);

-- ============================================================================
-- STEP 6: Insert Default/Initial Records (Lookup Data)
-- ============================================================================

-- Insert User Roles
INSERT INTO user_roles (role_code, description) VALUES
    ('DESIGNER', 'Designer/Contributor - Can upload files and track approval status'),
    ('REVIEWER', 'Creative Reviewer - Can review files, provide feedback, and approve/request changes'),
    ('ADMIN', 'Platform Admin - Can manage users, organizations, roles, and project settings'),
    ('MANAGER', 'Manager - Can manage projects and teams within an organization'),
    ('OWNER', 'Organization Owner - Can manage organization projects and membership')
ON CONFLICT (role_code) DO NOTHING;

-- Insert Approval Statuses
INSERT INTO approval_statuses (status_code, description) VALUES
    ('PENDING_REVIEW', 'File is pending review'),
    ('CHANGES_REQUESTED', 'Changes have been requested'),
    ('APPROVED', 'File has been approved')
ON CONFLICT (status_code) DO NOTHING;

-- ============================================================================
-- STEP 7: Insert Test/Seed Data (Optional - for development)
-- ============================================================================

-- Insert Test Users (bcrypt-hashed)
-- Password for all test users: TestPass123!

INSERT INTO users (email, password_hash, role_id, is_active) VALUES
    ('admin@vellum.test', '$2b$10$e50BR7WpS2TDQeiZPzwVI.AwvTKItNzI2H8n9gzQDphR3tbfFdqQa', 
     (SELECT id FROM user_roles WHERE role_code = 'ADMIN'), TRUE),
    ('designer@vellum.test', '$2b$10$e50BR7WpS2TDQeiZPzwVI.AwvTKItNzI2H8n9gzQDphR3tbfFdqQa',
     (SELECT id FROM user_roles WHERE role_code = 'DESIGNER'), TRUE),
    ('reviewer@vellum.test', '$2b$10$e50BR7WpS2TDQeiZPzwVI.AwvTKItNzI2H8n9gzQDphR3tbfFdqQa',
     (SELECT id FROM user_roles WHERE role_code = 'REVIEWER'), TRUE),
    ('manager@vellum.test', '$2b$10$e50BR7WpS2TDQeiZPzwVI.AwvTKItNzI2H8n9gzQDphR3tbfFdqQa',
     (SELECT id FROM user_roles WHERE role_code = 'MANAGER'), TRUE),
    ('owner@vellum.test', '$2b$10$e50BR7WpS2TDQeiZPzwVI.AwvTKItNzI2H8n9gzQDphR3tbfFdqQa',
     (SELECT id FROM user_roles WHERE role_code = 'OWNER'), TRUE),
    ('client-reviewer@vellum.test', '$2b$10$e50BR7WpS2TDQeiZPzwVI.AwvTKItNzI2H8n9gzQDphR3tbfFdqQa',
     (SELECT id FROM user_roles WHERE role_code = 'REVIEWER'), TRUE),
    ('jill.valentine@raccooncity.example', '$2b$10$e50BR7WpS2TDQeiZPzwVI.AwvTKItNzI2H8n9gzQDphR3tbfFdqQa',
     (SELECT id FROM user_roles WHERE role_code = 'OWNER'), TRUE),
    ('leon.kennedy@raccooncity.example', '$2b$10$e50BR7WpS2TDQeiZPzwVI.AwvTKItNzI2H8n9gzQDphR3tbfFdqQa',
     (SELECT id FROM user_roles WHERE role_code = 'MANAGER'), TRUE),
    ('claire.redfield@raccooncity.example', '$2b$10$e50BR7WpS2TDQeiZPzwVI.AwvTKItNzI2H8n9gzQDphR3tbfFdqQa',
     (SELECT id FROM user_roles WHERE role_code = 'DESIGNER'), TRUE),
    ('chris.redfield@raccooncity.example', '$2b$10$e50BR7WpS2TDQeiZPzwVI.AwvTKItNzI2H8n9gzQDphR3tbfFdqQa',
     (SELECT id FROM user_roles WHERE role_code = 'REVIEWER'), TRUE),
    ('albert.wesker@raccooncity.example', '$2b$10$e50BR7WpS2TDQeiZPzwVI.AwvTKItNzI2H8n9gzQDphR3tbfFdqQa',
     (SELECT id FROM user_roles WHERE role_code = 'REVIEWER'), TRUE)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- STEP 8: Create Functions and Triggers (Optional)
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at on files table
DROP TRIGGER IF EXISTS update_files_updated_at ON files;
CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 9: Assets API Schema + Seed Data
-- ============================================================================

-- Keeps existing setup.sql model intact and add assets-specific tables as used by
-- /api/assets endpoints.

CREATE TABLE IF NOT EXISTS roles_lookup (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles_lookup (role_name) VALUES
    ('Admin'),
    ('Designer'),
    ('Reviewer')
ON CONFLICT (role_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS asset_status_lookup (
    id SERIAL PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO asset_status_lookup (status_name) VALUES
    ('In Progress'),
    ('Ready for Internal Review'),
    ('In Internal Review'),
    ('In Review'),
    ('Ready for Client Review'),
    ('In Client Review'),
    ('Approved'),
    ('Approved (Internal)'),
    ('Approved (Client)'),
    ('Changes Requested'),
    ('Changes Requested (Internal)'),
    ('Client Changes Requested')
ON CONFLICT (status_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS comment_type_lookup (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO comment_type_lookup (type_name) VALUES
    ('General'),
    ('Changes Requested'),
    ('Approval Note')
ON CONFLICT (type_name) DO NOTHING;

ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_invited_by_user_id ON users(invited_by_user_id);

UPDATE users
SET display_name = COALESCE(display_name, 'Admin User')
WHERE email = 'admin@vellum.test';

UPDATE users
SET display_name = COALESCE(display_name, 'Designer User')
WHERE email = 'designer@vellum.test';

UPDATE users
SET display_name = COALESCE(display_name, 'Reviewer User')
WHERE email = 'reviewer@vellum.test';

UPDATE users
SET display_name = COALESCE(display_name, 'Manager User')
WHERE email = 'manager@vellum.test';

UPDATE users
SET display_name = COALESCE(display_name, 'Organization Owner')
WHERE email = 'owner@vellum.test';

UPDATE users
SET display_name = COALESCE(display_name, 'Client Reviewer User')
WHERE email = 'client-reviewer@vellum.test';

UPDATE users
SET display_name = COALESCE(display_name, 'Jill Valentine')
WHERE email = 'jill.valentine@raccooncity.example';

UPDATE users
SET display_name = COALESCE(display_name, 'Leon Kennedy')
WHERE email = 'leon.kennedy@raccooncity.example';

UPDATE users
SET display_name = COALESCE(display_name, 'Claire Redfield')
WHERE email = 'claire.redfield@raccooncity.example';

UPDATE users
SET display_name = COALESCE(display_name, 'Chris Redfield')
WHERE email = 'chris.redfield@raccooncity.example';

UPDATE users
SET display_name = COALESCE(display_name, 'Albert Wesker')
WHERE email = 'albert.wesker@raccooncity.example';

-- ============================================================================
-- STEP 9: Sprint 3 Organizations, Clients, Projects, and Project Teams
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    details TEXT,
    created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active);

CREATE TABLE IF NOT EXISTS organization_members (
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'DESIGNER', 'REVIEWER')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);

CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    priority TEXT,
    due_date DATE,
    created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_owner_user_id ON projects(owner_user_id);

CREATE TABLE IF NOT EXISTS project_members (
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);

CREATE TABLE IF NOT EXISTS project_activity (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    summary TEXT NOT NULL,
    details TEXT,
    actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_activity_project_created
    ON project_activity (project_id, created_at DESC);

-- Remove the prior thin Sprint 3 seed org so local re-runs converge on the
-- richer two-organization seed set below without touching unrelated data.
DELETE FROM project_activity
WHERE project_id IN (
  SELECT id FROM projects
  WHERE name IN ('Brand Compliance Review')
);

DELETE FROM project_members
WHERE project_id IN (
  SELECT id FROM projects
  WHERE name IN ('Brand Compliance Review')
);

DELETE FROM projects
WHERE name IN ('Brand Compliance Review');

DELETE FROM clients
WHERE name IN ('Summit Bank');

DELETE FROM organization_members
WHERE organization_id IN (
  SELECT id FROM organizations
  WHERE name = 'Northstar Studio'
);

DELETE FROM organizations
WHERE name = 'Northstar Studio';

INSERT INTO organizations (name, description, details, created_by_user_id)
SELECT seed.name,
       seed.description,
       seed.details,
       (SELECT id FROM users WHERE email = 'admin@vellum.test')
FROM (
    VALUES
      (
        'Acme Outdoor Co.',
        'Seed organization for standard Sprint 3 project workflows.',
        'Primary demo organization used for owner, manager, upload, review, and project-filter flows.'
      ),
      (
        'Raccoon City Archives',
        'Resident Evil themed seed organization for multi-tenant demo coverage.',
        'Fun secondary organization used to prove users, projects, assets, comments, and activity remain scoped by organization.'
      )
) AS seed(name, description, details)
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = seed.name);

INSERT INTO organization_members (organization_id, user_id, role)
SELECT o.id, u.id, seed.role
FROM organizations o
JOIN (
    VALUES
      ('Acme Outdoor Co.', 'owner@vellum.test', 'OWNER'),
      ('Acme Outdoor Co.', 'manager@vellum.test', 'MANAGER'),
      ('Acme Outdoor Co.', 'designer@vellum.test', 'DESIGNER'),
      ('Acme Outdoor Co.', 'reviewer@vellum.test', 'REVIEWER'),
      ('Acme Outdoor Co.', 'client-reviewer@vellum.test', 'REVIEWER'),
      ('Acme Outdoor Co.', 'admin@vellum.test', 'OWNER'),
      ('Raccoon City Archives', 'jill.valentine@raccooncity.example', 'OWNER'),
      ('Raccoon City Archives', 'leon.kennedy@raccooncity.example', 'MANAGER'),
      ('Raccoon City Archives', 'claire.redfield@raccooncity.example', 'DESIGNER'),
      ('Raccoon City Archives', 'chris.redfield@raccooncity.example', 'REVIEWER'),
      ('Raccoon City Archives', 'albert.wesker@raccooncity.example', 'REVIEWER'),
      ('Raccoon City Archives', 'admin@vellum.test', 'OWNER')
) AS seed(org_name, email, role)
  ON seed.org_name = o.name
JOIN users u ON u.email = seed.email
ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role;

INSERT INTO clients (organization_id, name, description)
SELECT o.id, seed.client_name, seed.description
FROM organizations o
JOIN (
    VALUES
      ('Acme Outdoor Co.', 'Trailhead Retail', 'Retail client for the Acme spring launch.'),
      ('Acme Outdoor Co.', 'Peak Supply Wholesale', 'Wholesale client used for Acme packaging and catalog flows.'),
      ('Raccoon City Archives', 'S.T.A.R.S. Records Unit', 'Internal review client for incident reports and field documentation.'),
      ('Raccoon City Archives', 'Umbrella Containment Desk', 'External stakeholder for lab signage and safety packet reviews.')
) AS seed(org_name, client_name, description)
  ON seed.org_name = o.name
WHERE NOT EXISTS (
    SELECT 1 FROM clients c
    WHERE c.organization_id = o.id
      AND c.name = seed.client_name
);

INSERT INTO projects (client_id, organization_id, name, description, status, priority, due_date, created_by_user_id, owner_user_id)
SELECT c.id,
       o.id,
       seed.project_name,
       seed.description,
       seed.status,
       seed.priority,
       seed.due_date,
       (SELECT id FROM users WHERE email = seed.created_by_email),
       (SELECT id FROM users WHERE email = seed.owner_email)
FROM organizations o
JOIN (
    VALUES
      ('Acme Outdoor Co.', 'Trailhead Retail', 'Spring Launch Campaign', 'Initial push for campaign creative: landing page, social, email, and packaging assets.', 'Active', 'High', DATE '2026-04-30', 'manager@vellum.test', 'owner@vellum.test'),
      ('Acme Outdoor Co.', 'Trailhead Retail', 'Website Refresh', 'Secondary Acme project for project filter and team assignment demos.', 'On hold', 'Medium', DATE '2026-05-15', 'manager@vellum.test', 'owner@vellum.test'),
      ('Acme Outdoor Co.', 'Peak Supply Wholesale', 'Packaging Refresh', 'Retail packaging update with label, dieline, and compliance review assets.', 'Active', 'High', DATE '2026-05-22', 'manager@vellum.test', 'owner@vellum.test'),
      ('Raccoon City Archives', 'S.T.A.R.S. Records Unit', 'Mansion Incident Archive', 'Field report packet for the Spencer Mansion incident archive.', 'Active', 'Critical', DATE '2026-04-28', 'leon.kennedy@raccooncity.example', 'jill.valentine@raccooncity.example'),
      ('Raccoon City Archives', 'S.T.A.R.S. Records Unit', 'RPD Evidence Board', 'Evidence board materials for RPD case notes, photos, and witness summaries.', 'Active', 'High', DATE '2026-05-08', 'leon.kennedy@raccooncity.example', 'jill.valentine@raccooncity.example'),
      ('Raccoon City Archives', 'Umbrella Containment Desk', 'Umbrella Lab Containment Review', 'Safety signage, containment labels, and emergency protocol assets.', 'In review', 'Critical', DATE '2026-05-18', 'leon.kennedy@raccooncity.example', 'jill.valentine@raccooncity.example')
) AS seed(org_name, client_name, project_name, description, status, priority, due_date, created_by_email, owner_email)
  ON seed.org_name = o.name
JOIN clients c ON c.organization_id = o.id AND c.name = seed.client_name
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = seed.project_name);

INSERT INTO project_members (project_id, user_id, assigned_by_user_id)
SELECT p.id, u.id, (SELECT id FROM users WHERE email = 'manager@vellum.test')
FROM projects p
JOIN users u ON u.email IN ('designer@vellum.test', 'reviewer@vellum.test', 'client-reviewer@vellum.test')
WHERE p.name IN ('Spring Launch Campaign', 'Packaging Refresh')
ON CONFLICT (project_id, user_id) DO NOTHING;

INSERT INTO project_members (project_id, user_id, assigned_by_user_id)
SELECT p.id, u.id, (SELECT id FROM users WHERE email = 'manager@vellum.test')
FROM projects p
JOIN users u ON u.email IN ('designer@vellum.test', 'reviewer@vellum.test')
WHERE p.name = 'Website Refresh'
ON CONFLICT (project_id, user_id) DO NOTHING;

INSERT INTO project_members (project_id, user_id, assigned_by_user_id)
SELECT p.id, u.id, (SELECT id FROM users WHERE email = 'leon.kennedy@raccooncity.example')
FROM projects p
JOIN users u ON u.email IN ('claire.redfield@raccooncity.example', 'chris.redfield@raccooncity.example', 'albert.wesker@raccooncity.example')
WHERE p.name IN ('Mansion Incident Archive', 'RPD Evidence Board', 'Umbrella Lab Containment Review')
ON CONFLICT (project_id, user_id) DO NOTHING;

-- ============================================================================
-- STEP 9: Assets + Versions model for Sprint 2
-- ============================================================================

CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    asset_type TEXT,
    external_url TEXT,
    status_id INTEGER NOT NULL REFERENCES asset_status_lookup(id),
    current_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    created_by_user_id INTEGER REFERENCES users(id),
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Versions table for assets (lightweight history; not tied to binary files yet)
CREATE TABLE IF NOT EXISTS asset_versions (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    created_by_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE asset_versions ADD COLUMN IF NOT EXISTS label VARCHAR(100);
ALTER TABLE asset_versions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE asset_versions ADD COLUMN IF NOT EXISTS original_file_name VARCHAR(255);
ALTER TABLE asset_versions ADD COLUMN IF NOT EXISTS stored_file_name VARCHAR(255);
ALTER TABLE asset_versions ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);
ALTER TABLE asset_versions ADD COLUMN IF NOT EXISTS size_bytes BIGINT;
ALTER TABLE asset_versions ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);

ALTER TABLE assets ADD COLUMN IF NOT EXISTS current_version_id INTEGER REFERENCES asset_versions(id);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS asset_type TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS external_url TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_assets_current_version_id ON assets(current_version_id);
CREATE INDEX IF NOT EXISTS idx_assets_project_id ON assets(project_id);

CREATE TABLE IF NOT EXISTS asset_comments (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    asset_version_id INTEGER REFERENCES asset_versions(id),
    author_user_id INTEGER REFERENCES users(id),
    comment_type_id INTEGER REFERENCES comment_type_lookup(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS asset_tags (
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (asset_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_asset_tags_tag ON asset_tags(tag);

-- Audit log for admin actions on versions (delete, edit metadata)
CREATE TABLE IF NOT EXISTS asset_version_audit (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  asset_version_id INTEGER REFERENCES asset_versions(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  performed_by_user_id INTEGER REFERENCES users(id),
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  details TEXT
);
CREATE INDEX IF NOT EXISTS idx_asset_version_audit_asset_id ON asset_version_audit(asset_id);

-- Remove old Sprint 1/2 demo titles from fresh/local setup re-runs so the
-- default database reflects the Sprint 3 project workflow instead.
DELETE FROM assets
WHERE title IN (
  'Homepage Hero Banner',
  'Instagram Carousel Set',
  'Packaging Label Concept',
  'Email Header Illustration',
  'Northstar Brand Checklist'
);

INSERT INTO assets (title, description, asset_type, external_url, status_id, current_version, created_by_user_id, project_id)
SELECT seed.title,
       seed.description,
       seed.asset_type,
       seed.external_url,
       (SELECT id FROM asset_status_lookup WHERE status_name = seed.status_name),
       'v1.0',
       (SELECT id FROM users WHERE email = seed.created_by_email),
       p.id
FROM projects p
JOIN (
    VALUES
      ('Spring Launch Campaign', 'Initial Push - Landing Page Hero', 'First asset in the Spring Launch initial push. Used to demo project-linked upload, queue filtering, and internal review.', 'mockup', NULL, 'In Internal Review', 'designer@vellum.test'),
      ('Spring Launch Campaign', 'Initial Push - Social Carousel Copy', 'Copy deck for the launch carousel. Ready for internal reviewer approval.', 'document', NULL, 'Ready for Internal Review', 'designer@vellum.test'),
      ('Spring Launch Campaign', 'Initial Push - Packaging Label QA', 'Packaging label needs legal-copy revisions before it can move forward.', 'image', NULL, 'Changes Requested (Internal)', 'designer@vellum.test'),
      ('Website Refresh', 'Website Refresh - IA Notes', 'Planning notes for the Acme website refresh project.', 'note', NULL, 'In Progress', 'designer@vellum.test'),
      ('Website Refresh', 'Website Refresh - Homepage Wireframe', 'Homepage wireframe for the first Acme stakeholder review.', 'mockup', NULL, 'Ready for Internal Review', 'designer@vellum.test'),
      ('Packaging Refresh', 'Packaging Refresh - Trail Mix Label', 'Updated label concept for the wholesale trail mix line.', 'image', NULL, 'In Review', 'designer@vellum.test'),
      ('Packaging Refresh', 'Packaging Refresh - Compliance Checklist', 'Internal compliance checklist for nutrition copy and barcode placement.', 'document', NULL, 'Ready for Client Review', 'designer@vellum.test'),
      ('Mansion Incident Archive', 'Mansion Incident - Field Report Cover', 'Cover design for the Spencer Mansion incident packet.', 'document', NULL, 'In Internal Review', 'claire.redfield@raccooncity.example'),
      ('Mansion Incident Archive', 'Mansion Incident - Map Annotations', 'Annotated first-floor map with safe-room and hazard notes.', 'image', NULL, 'Changes Requested (Internal)', 'claire.redfield@raccooncity.example'),
      ('RPD Evidence Board', 'RPD Evidence Board - Witness Timeline', 'Timeline deck for witness statements and overnight events.', 'document', NULL, 'Ready for Internal Review', 'claire.redfield@raccooncity.example'),
      ('RPD Evidence Board', 'RPD Evidence Board - Photo Contact Sheet', 'Photo sheet for case images and scene references.', 'image', NULL, 'In Progress', 'claire.redfield@raccooncity.example'),
      ('Umbrella Lab Containment Review', 'Umbrella Lab - Biohazard Signage', 'Containment signage pass for restricted lab corridors.', 'image', NULL, 'In Client Review', 'claire.redfield@raccooncity.example'),
      ('Umbrella Lab Containment Review', 'Umbrella Lab - Emergency Protocol Card', 'Wallet-card layout for emergency protocol steps.', 'document', NULL, 'Approved (Internal)', 'claire.redfield@raccooncity.example')
) AS seed(project_name, title, description, asset_type, external_url, status_name, created_by_email)
  ON seed.project_name = p.name
WHERE NOT EXISTS (SELECT 1 FROM assets WHERE title = seed.title);

INSERT INTO asset_tags (asset_id, tag)
SELECT a.id, seed.tag
FROM assets a
JOIN (
    VALUES
      ('Initial Push - Landing Page Hero', 'campaign'),
      ('Initial Push - Landing Page Hero', 'hero'),
      ('Initial Push - Social Carousel Copy', 'social'),
      ('Initial Push - Social Carousel Copy', 'copy'),
      ('Initial Push - Packaging Label QA', 'packaging'),
      ('Initial Push - Packaging Label QA', 'legal'),
      ('Website Refresh - IA Notes', 'planning'),
      ('Website Refresh - IA Notes', 'website'),
      ('Website Refresh - Homepage Wireframe', 'wireframe'),
      ('Website Refresh - Homepage Wireframe', 'homepage'),
      ('Packaging Refresh - Trail Mix Label', 'label'),
      ('Packaging Refresh - Trail Mix Label', 'retail'),
      ('Packaging Refresh - Compliance Checklist', 'compliance'),
      ('Packaging Refresh - Compliance Checklist', 'client-review'),
      ('Mansion Incident - Field Report Cover', 's-t-a-r-s'),
      ('Mansion Incident - Field Report Cover', 'incident-report'),
      ('Mansion Incident - Map Annotations', 'map'),
      ('Mansion Incident - Map Annotations', 'hazard'),
      ('RPD Evidence Board - Witness Timeline', 'rpd'),
      ('RPD Evidence Board - Witness Timeline', 'timeline'),
      ('RPD Evidence Board - Photo Contact Sheet', 'evidence'),
      ('RPD Evidence Board - Photo Contact Sheet', 'photo'),
      ('Umbrella Lab - Biohazard Signage', 'umbrella'),
      ('Umbrella Lab - Biohazard Signage', 'biohazard'),
      ('Umbrella Lab - Emergency Protocol Card', 'protocol'),
      ('Umbrella Lab - Emergency Protocol Card', 'containment')
) AS seed(title, tag)
  ON seed.title = a.title
ON CONFLICT (asset_id, tag) DO NOTHING;

-- Seed one version row for each asset if none exist yet.
INSERT INTO asset_versions (asset_id, version_number, created_by_user_id, label, notes, original_file_name, mime_type)
SELECT
  a.id,
  1,
  a.created_by_user_id,
  'Initial push',
  'Seeded from database/setup.sql for Sprint 3 demo flows.',
  lower(regexp_replace(a.title, '[^a-zA-Z0-9]+', '-', 'g')) || '.md',
  'text/markdown'
FROM assets a
WHERE NOT EXISTS (
  SELECT 1 FROM asset_versions v WHERE v.asset_id = a.id
);

UPDATE assets a
SET current_version_id = v.id
FROM asset_versions v
WHERE v.asset_id = a.id
  AND v.version_number = 1
  AND a.current_version_id IS NULL;

INSERT INTO asset_comments (asset_id, asset_version_id, author_user_id, comment_type_id, message)
SELECT
    a.id,
    a.current_version_id,
    u.id,
    t.id,
    'Please tighten the legal disclaimer before this moves to client review.'
FROM assets a, users u, comment_type_lookup t
WHERE a.title = 'Initial Push - Packaging Label QA'
  AND u.email = 'reviewer@vellum.test'
  AND t.type_name = 'Changes Requested'
  AND NOT EXISTS (
      SELECT 1 FROM asset_comments c
      WHERE c.asset_id = a.id
        AND c.message = 'Please tighten the legal disclaimer before this moves to client review.'
  );

INSERT INTO asset_comments (asset_id, asset_version_id, author_user_id, comment_type_id, message)
SELECT
    a.id,
    a.current_version_id,
    u.id,
    t.id,
    'Initial push uploaded and ready for review.'
FROM assets a, users u, comment_type_lookup t
WHERE a.title = 'Initial Push - Landing Page Hero'
  AND u.email = 'designer@vellum.test'
  AND t.type_name = 'General'
  AND NOT EXISTS (
      SELECT 1 FROM asset_comments c
      WHERE c.asset_id = a.id
        AND c.message = 'Initial push uploaded and ready for review.'
  );

INSERT INTO asset_comments (asset_id, asset_version_id, author_user_id, comment_type_id, message)
SELECT
    a.id,
    a.current_version_id,
    u.id,
    t.id,
    'Add a clearer route marker near the east stairwell before archive approval.'
FROM assets a, users u, comment_type_lookup t
WHERE a.title = 'Mansion Incident - Map Annotations'
  AND u.email = 'chris.redfield@raccooncity.example'
  AND t.type_name = 'Changes Requested'
  AND NOT EXISTS (
      SELECT 1 FROM asset_comments c
      WHERE c.asset_id = a.id
        AND c.message = 'Add a clearer route marker near the east stairwell before archive approval.'
  );

INSERT INTO asset_comments (asset_id, asset_version_id, author_user_id, comment_type_id, message)
SELECT
    a.id,
    a.current_version_id,
    u.id,
    t.id,
    'Containment wording is approved for internal routing.'
FROM assets a, users u, comment_type_lookup t
WHERE a.title = 'Umbrella Lab - Emergency Protocol Card'
  AND u.email = 'albert.wesker@raccooncity.example'
  AND t.type_name = 'Approval Note'
  AND NOT EXISTS (
      SELECT 1 FROM asset_comments c
      WHERE c.asset_id = a.id
        AND c.message = 'Containment wording is approved for internal routing.'
  );

INSERT INTO project_activity (project_id, event_type, summary, details, actor_user_id)
SELECT
    p.id,
    'initial_push',
    'Initial push seeded',
    'Seeded assets were attached to this project by database/setup.sql for Sprint 3 demo and verification flows.',
    COALESCE(
      (SELECT id FROM users WHERE email = CASE
        WHEN p.name IN ('Mansion Incident Archive', 'RPD Evidence Board', 'Umbrella Lab Containment Review')
          THEN 'claire.redfield@raccooncity.example'
        ELSE 'designer@vellum.test'
      END),
      (SELECT id FROM users WHERE email = 'admin@vellum.test')
    )
FROM projects p
WHERE p.name IN (
    'Spring Launch Campaign',
    'Website Refresh',
    'Packaging Refresh',
    'Mansion Incident Archive',
    'RPD Evidence Board',
    'Umbrella Lab Containment Review'
)
  AND NOT EXISTS (
    SELECT 1
    FROM project_activity pa
    WHERE pa.project_id = p.id
      AND pa.event_type = 'initial_push'
      AND pa.summary = 'Initial push seeded'
  );

-- ============================================================================
-- STEP 10: Verification Queries
-- ============================================================================

-- Verify legacy lookup tables were created and populated
SELECT 'User Roles:' as info;
SELECT * FROM user_roles;

SELECT 'Approval Statuses:' as info;
SELECT * FROM approval_statuses;

SELECT 'Test Users:' as info;
SELECT u.id, u.email, u.display_name, ur.role_code, u.is_active
FROM users u
JOIN user_roles ur ON u.role_id = ur.id;

SELECT 'Seeded Organizations:' as info;
SELECT id, name, is_active
FROM organizations
ORDER BY id;

SELECT 'Seeded Projects:' as info;
SELECT p.id,
       p.name,
       o.name AS organization,
       c.name AS client,
       p.status,
       p.priority,
       p.due_date,
       owner.email AS owner_email
FROM projects p
LEFT JOIN organizations o ON o.id = p.organization_id
LEFT JOIN clients c ON c.id = p.client_id
LEFT JOIN users owner ON owner.id = p.owner_user_id
ORDER BY p.id;

SELECT 'Project Members:' as info;
SELECT p.name AS project, u.email, pm.assigned_at
FROM project_members pm
JOIN projects p ON p.id = pm.project_id
JOIN users u ON u.id = pm.user_id
ORDER BY p.name, u.email;

-- Verify assets API lookup tables and seed data
SELECT 'Asset Status Lookup:' as info;
SELECT * FROM asset_status_lookup;

SELECT 'Seeded Assets:' as info;
SELECT a.id,
       a.title,
       p.name AS project,
       o.name AS organization,
       s.status_name,
       a.current_version,
       COALESCE(string_agg(t.tag, ', ' ORDER BY t.tag), '') AS tags
FROM assets a
JOIN asset_status_lookup s ON s.id = a.status_id
LEFT JOIN projects p ON p.id = a.project_id
LEFT JOIN organizations o ON o.id = p.organization_id
LEFT JOIN asset_tags t ON t.asset_id = a.id
GROUP BY a.id, a.title, p.name, o.name, s.status_name, a.current_version
ORDER BY a.id;

SELECT 'Asset Versions:' as info;
SELECT v.id, v.asset_id, v.version_number, v.created_at
FROM asset_versions v
ORDER BY v.asset_id, v.version_number;

SELECT 'Project Activity:' as info;
SELECT p.name AS project, pa.event_type, pa.summary, actor.email AS actor
FROM project_activity pa
JOIN projects p ON p.id = pa.project_id
LEFT JOIN users actor ON actor.id = pa.actor_user_id
ORDER BY p.name, pa.created_at;

-- ============================================================================
-- Setup Complete
-- ============================================================================

-- Database setup script completed successfully!
-- Next steps:
-- 1. Verify all tables were created: \dt (in psql)
-- 2. Verify data was inserted: Run verification queries above
-- 3. Update application connection string in .env file
-- 4. Test database connection from application
