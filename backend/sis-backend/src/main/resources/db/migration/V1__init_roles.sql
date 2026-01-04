-- V1__init_roles.sql
-- Creates roles table and seeds initial roles using a PERMISSION BITMASK

CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    permission_level INT NOT NULL
);

-- ------------------------------------------------------------
-- Permission bits (documented here for clarity)
--
-- 1   = VIEW_STUDENT_DIRECTORY
-- 2   = VIEW_STUDENT_DETAILS
-- 4   = EDIT_STUDENT_DETAILS
--
-- 8   = VIEW_GUARDIAN_CONTACT
-- 16  = VIEW_GUARDIAN_ADDRESS
-- 32  = EDIT_GUARDIAN_SELF
--
-- 64  = VIEW_ATTENDANCE
-- 128 = EDIT_ATTENDANCE
-- 256 = CREATE_GUARDIAN
-- 512 = CREATE_STUDENT

-- 1024 = VIEW_CLASSES

-- 2048 = CREATE_USER
-- ------------------------------------------------------------

-- VIEWER:
-- Can browse basic student/class directory only
-- 1
INSERT INTO roles (name, permission_level)
VALUES ('VIEWER', 1)
ON CONFLICT (name) DO NOTHING;

-- PARENT:
-- Can view own child details + attendance
-- Can view own guardian contact details (address/self-edit to be re-enabled with self-checks)
-- TODO: Add VIEW_GUARDIAN_ADDRESS + EDIT_GUARDIAN_SELF once self-checks are implemented. aswell as own child checks
-- 1 + 2 + 8 + 16 + 32 + 64 = 123
INSERT INTO roles (name, permission_level)
VALUES ('PARENT', 123)
ON CONFLICT (name) DO NOTHING;

-- TEACHER:
-- Can view/edit students in their classes
-- Can view guardian contact (not address)
-- Can view/edit attendance
-- 1 + 2 + 4 + 8 + 64 + 128 + 1024 = 1231
INSERT INTO roles (name, permission_level)
VALUES ('TEACHER', 1231)
ON CONFLICT (name) DO NOTHING;

-- ADMIN:
-- Full access (all defined permissions)
-- 1 + 2 + 4 + 8 + 16 + 32 + 64 + 128 + 256 + 512 + 1024 + 2048 = 4095
INSERT INTO roles (name, permission_level)
VALUES ('ADMIN', 4095)
ON CONFLICT (name) DO NOTHING;


