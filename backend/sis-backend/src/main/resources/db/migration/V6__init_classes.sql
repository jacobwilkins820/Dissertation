-- V6__init_classes.sql
-- Creates classes table (if missing) and seeds a small starter set.
-- Also links some existing TEACHER users as class teachers (teacher_id is optional).

-- 1) Table
CREATE TABLE IF NOT EXISTS classes (
    id          BIGSERIAL PRIMARY KEY,
    teacher_id  BIGINT NULL REFERENCES users(id),
    name        VARCHAR(100) NOT NULL,
    code        VARCHAR(20) UNIQUE,
    active      BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_active ON classes(active);

-- 2) Seed data + teacher linking
DO $$
DECLARE
    teacher_count INTEGER;
BEGIN
    -- How many teacher users exist?
    -- dev note: assumes users.role_id -> roles.id and roles.name contains 'TEACHER'
    SELECT COUNT(*)
    INTO teacher_count
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE r.name = 'TEACHER';

    -- dev note: teacher_id is assigned only if we have teacher users, otherwise left NULL.
    IF teacher_count = 0 THEN 
        INSERT INTO classes (name, code, active, teacher_id) VALUES
            ('Year 1', 'Y1', true, NULL),
            ('Year 2', 'Y2', true, NULL),
            ('Year 3 - A', 'Y3A', true, NULL),
            ('Year 3 - B', 'Y3B', true, NULL),
            ('Year 4', 'Y4', true, NULL)
        ON CONFLICT (code) DO NOTHING;
    ELSE
        -- Pick teachers in a stable order (lowest id first)
        INSERT INTO classes (name, code, active, teacher_id) VALUES
            ('Year 1', 'Y1', true,
                (SELECT u.id FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='TEACHER' ORDER BY u.id LIMIT 1 OFFSET 0)),
            ('Year 2', 'Y2', true,
                (SELECT u.id FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='TEACHER' ORDER BY u.id LIMIT 1 OFFSET 1)),
            ('Year 3 - A', 'Y3A', true,
                (SELECT u.id FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='TEACHER' ORDER BY u.id LIMIT 1 OFFSET 2)),
            ('Year 3 - B', 'Y3B', true,
                (SELECT u.id FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='TEACHER' ORDER BY u.id LIMIT 1 OFFSET 3)),
            ('Year 4', 'Y4', true,
                (SELECT u.id FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='TEACHER' ORDER BY u.id LIMIT 1 OFFSET 4))
        ON CONFLICT (code) DO NOTHING;

        -- dev note: if there are fewer than 5 teachers, some subqueries return NULL;
    END IF;
END $$;