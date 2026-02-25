-- Vellum Database Setup Script
-- PostgreSQL Database Initialization
-- Course: CS 4900 - Senior Capstone Project
-- Project: Vellum - Digital Asset Review & Approval Platform

-- ============================================================================
-- BOOTSTRAP: Create and connect to database
-- ============================================================================

SELECT 'CREATE DATABASE vellum'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'vellum')\gexec
\connect vellum;

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
ALTER TABLE files 
ADD CONSTRAINT fk_files_current_version 
FOREIGN KEY (current_version_id) REFERENCES file_versions(id);

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
    ('ADMIN', 'Admin/Project Owner - Can manage users, roles, and project settings')
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

-- Insert Test Users (passwords are hashed - these are examples)
-- In production, use proper password hashing (bcrypt, argon2, etc.)
-- Password for all test users: TestPass123!
-- These are example hashes - replace with actual bcrypt hashes in implementation

INSERT INTO users (email, password_hash, role_id, is_active) VALUES
    ('admin@vellum.test', '$2b$10$example_hash_replace_in_production', 
     (SELECT id FROM user_roles WHERE role_code = 'ADMIN'), TRUE),
    ('designer@vellum.test', '$2b$10$example_hash_replace_in_production',
     (SELECT id FROM user_roles WHERE role_code = 'DESIGNER'), TRUE),
    ('reviewer@vellum.test', '$2b$10$example_hash_replace_in_production',
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
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at on files table
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
    ('Draft'),
    ('In Review'),
    ('Approved'),
    ('Changes Requested')
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

UPDATE users
SET display_name = COALESCE(display_name, 'Admin User')
WHERE email = 'admin@vellum.test';

UPDATE users
SET display_name = COALESCE(display_name, 'Designer User')
WHERE email = 'designer@vellum.test';

UPDATE users
SET display_name = COALESCE(display_name, 'Reviewer User')
WHERE email = 'reviewer@vellum.test';

-- ============================================================================
-- STEP 9: Assets + Versions model for Sprint 2
-- ============================================================================

CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status_id INTEGER NOT NULL REFERENCES asset_status_lookup(id),
    current_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    created_by_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS asset_comments (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    author_user_id INTEGER REFERENCES users(id),
    comment_type_id INTEGER REFERENCES comment_type_lookup(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

INSERT INTO assets (title, description, status_id, current_version, created_by_user_id)
SELECT
    'Homepage Hero Banner',
    'Main campaign hero graphic for spring launch.',
    (SELECT id FROM asset_status_lookup WHERE status_name = 'In Review'),
    'v2.0',
    (SELECT id FROM users WHERE email = 'designer@vellum.test')
WHERE NOT EXISTS (SELECT 1 FROM assets WHERE title = 'Homepage Hero Banner');

INSERT INTO assets (title, description, status_id, current_version, created_by_user_id)
SELECT
    'Instagram Carousel Set',
    '5-card promo carousel with CTA variants.',
    (SELECT id FROM asset_status_lookup WHERE status_name = 'Draft'),
    'v1.3',
    (SELECT id FROM users WHERE email = 'designer@vellum.test')
WHERE NOT EXISTS (SELECT 1 FROM assets WHERE title = 'Instagram Carousel Set');

INSERT INTO assets (title, description, status_id, current_version, created_by_user_id)
SELECT
    'Packaging Label Concept',
    'Round 2 packaging label with updated legal copy.',
    (SELECT id FROM asset_status_lookup WHERE status_name = 'Changes Requested'),
    'v1.1',
    (SELECT id FROM users WHERE email = 'designer@vellum.test')
WHERE NOT EXISTS (SELECT 1 FROM assets WHERE title = 'Packaging Label Concept');

INSERT INTO assets (title, description, status_id, current_version, created_by_user_id)
SELECT
    'Email Header Illustration',
    'Final email header illustration for March newsletter.',
    (SELECT id FROM asset_status_lookup WHERE status_name = 'Approved'),
    'v3.0',
    (SELECT id FROM users WHERE email = 'designer@vellum.test')
WHERE NOT EXISTS (SELECT 1 FROM assets WHERE title = 'Email Header Illustration');

INSERT INTO asset_comments (asset_id, author_user_id, comment_type_id, message)
SELECT
    a.id,
    u.id,
    t.id,
    'Please tighten spacing around the headline before final approval.'
FROM assets a, users u, comment_type_lookup t
WHERE a.title = 'Homepage Hero Banner'
  AND u.email = 'reviewer@vellum.test'
  AND t.type_name = 'Changes Requested'
  AND NOT EXISTS (
      SELECT 1 FROM asset_comments c
      WHERE c.asset_id = a.id
        AND c.message = 'Please tighten spacing around the headline before final approval.'
  );

INSERT INTO asset_comments (asset_id, author_user_id, comment_type_id, message)
SELECT
    a.id,
    u.id,
    t.id,
    'Updated spacing looks good to me.'
FROM assets a, users u, comment_type_lookup t
WHERE a.title = 'Homepage Hero Banner'
  AND u.email = 'designer@vellum.test'
  AND t.type_name = 'General'
  AND NOT EXISTS (
      SELECT 1 FROM asset_comments c
      WHERE c.asset_id = a.id
        AND c.message = 'Updated spacing looks good to me.'
  );

-- Seed one version row for each existing asset if none exist yet (v1 baseline)
INSERT INTO asset_versions (asset_id, version_number, created_by_user_id)
SELECT a.id, 1, a.created_by_user_id
FROM assets a
WHERE NOT EXISTS (
  SELECT 1 FROM asset_versions v WHERE v.asset_id = a.id
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
SELECT u.id, u.email, ur.role_code, u.is_active
FROM users u
JOIN user_roles ur ON u.role_id = ur.id;

-- Verify assets API lookup tables and seed data
SELECT 'Asset Status Lookup:' as info;
SELECT * FROM asset_status_lookup;

SELECT 'Seeded Assets:' as info;
SELECT a.id, a.title, s.status_name, a.current_version
FROM assets a
JOIN asset_status_lookup s ON s.id = a.status_id
ORDER BY a.id;

SELECT 'Asset Versions:' as info;
SELECT v.id, v.asset_id, v.version_number, v.created_at
FROM asset_versions v
ORDER BY v.asset_id, v.version_number;

-- ============================================================================
-- Setup Complete
-- ============================================================================

-- Database setup script completed successfully!
-- Next steps:
-- 1. Verify all tables were created: \dt (in psql)
-- 2. Verify data was inserted: Run verification queries above
-- 3. Update application connection string in .env file
-- 4. Test database connection from application
