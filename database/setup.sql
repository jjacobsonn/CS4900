-- Vellum Database Setup Script
-- PostgreSQL Database Initialization
-- Course: CS 4900 - Senior Capstone Project
-- Project: Vellum - Digital Asset Review & Approval Platform

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
-- STEP 9: Verification Queries
-- ============================================================================

-- Verify lookup tables were created and populated
SELECT 'User Roles:' as info;
SELECT * FROM user_roles;

SELECT 'Approval Statuses:' as info;
SELECT * FROM approval_statuses;

SELECT 'Test Users:' as info;
SELECT u.id, u.email, ur.role_code, u.is_active 
FROM users u 
JOIN user_roles ur ON u.role_id = ur.id;

-- ============================================================================
-- Setup Complete
-- ============================================================================

-- Database setup script completed successfully!
-- Next steps:
-- 1. Verify all tables were created: \dt (in psql)
-- 2. Verify data was inserted: Run verification queries above
-- 3. Update application connection string in .env file
-- 4. Test database connection from application
