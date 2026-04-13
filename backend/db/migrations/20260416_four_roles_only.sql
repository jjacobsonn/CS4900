-- Remap users to four supported roles: admin, designer, reviewer, manager.
-- SUPER_ADMIN, PROJECT_OWNER -> ADMIN; CLIENT_REVIEWER -> REVIEWER

UPDATE users u
SET role_id = (SELECT id FROM user_roles WHERE role_code = 'ADMIN' LIMIT 1)
WHERE u.role_id IN (SELECT id FROM user_roles WHERE role_code IN ('SUPER_ADMIN', 'PROJECT_OWNER'));

UPDATE users u
SET role_id = (SELECT id FROM user_roles WHERE role_code = 'REVIEWER' LIMIT 1)
WHERE u.role_id = (SELECT id FROM user_roles WHERE role_code = 'CLIENT_REVIEWER');
