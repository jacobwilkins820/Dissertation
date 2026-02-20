-- V12__seed_attendance_and_email_classes.sql
-- Seeds two targeted classes for manual testing:
-- 1) Attendance class with 5 students and assorted records from the start of the current academic year.
-- 2) Email class with 2 students linked to parent guardians with specific email addresses.

DO $$
DECLARE
    v_teacher_id BIGINT;
    v_parent_role_id BIGINT;

    v_attendance_class_id BIGINT;
    v_email_class_id BIGINT;

    v_current_ay_id BIGINT;
    v_current_starts DATE;
    v_current_ends DATE;
    v_attendance_seed_end DATE;

    v_guardian_1_id BIGINT;
    v_guardian_2_id BIGINT;
BEGIN
    SELECT u.id
    INTO v_teacher_id
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE r.name = 'TEACHER'
    ORDER BY u.id
    LIMIT 1;

    SELECT id
    INTO v_parent_role_id
    FROM roles
    WHERE name = 'PARENT'
    LIMIT 1;

    IF v_parent_role_id IS NULL THEN
        RAISE EXCEPTION 'PARENT role not found.';
    END IF;

    INSERT INTO classes (name, code, active, teacher_id)
    VALUES ('Attendance', 'ATTENDANCE', TRUE, v_teacher_id)
    ON CONFLICT (code) DO UPDATE
    SET name = EXCLUDED.name,
        active = EXCLUDED.active,
        teacher_id = COALESCE(classes.teacher_id, EXCLUDED.teacher_id);

    INSERT INTO classes (name, code, active, teacher_id)
    VALUES ('Email', 'EMAIL', TRUE, v_teacher_id)
    ON CONFLICT (code) DO UPDATE
    SET name = EXCLUDED.name,
        active = EXCLUDED.active,
        teacher_id = COALESCE(classes.teacher_id, EXCLUDED.teacher_id);

    SELECT id
    INTO v_attendance_class_id
    FROM classes
    WHERE code = 'ATTENDANCE'
    LIMIT 1;

    SELECT id
    INTO v_email_class_id
    FROM classes
    WHERE code = 'EMAIL'
    LIMIT 1;

    IF v_attendance_class_id IS NULL OR v_email_class_id IS NULL THEN
        RAISE EXCEPTION 'Required classes could not be resolved.';
    END IF;

    INSERT INTO students (upn, first_name, last_name, date_of_birth, gender, status, created_at, updated_at)
    VALUES
        ('UPNATT0000000001', 'Aiden', 'Brooks', DATE '2014-09-14', 'MALE', 'ACTIVE', NOW(), NOW()),
        ('UPNATT0000000002', 'Sofia', 'Reed', DATE '2014-04-22', 'FEMALE', 'ACTIVE', NOW(), NOW()),
        ('UPNATT0000000003', 'Noah', 'Turner', DATE '2013-12-03', 'MALE', 'ACTIVE', NOW(), NOW()),
        ('UPNATT0000000004', 'Maya', 'Ellis', DATE '2014-07-18', 'FEMALE', 'ACTIVE', NOW(), NOW()),
        ('UPNATT0000000005', 'Liam', 'Patel', DATE '2014-01-09', 'MALE', 'ACTIVE', NOW(), NOW()),
        ('UPNEML0000000001', 'Eva', 'Wilkins', DATE '2015-02-11', 'FEMALE', 'ACTIVE', NOW(), NOW()),
        ('UPNEML0000000002', 'Owen', 'Wilkins', DATE '2015-06-29', 'MALE', 'ACTIVE', NOW(), NOW())
    ON CONFLICT (upn) DO NOTHING;

    SELECT id, starts_on, ends_on
    INTO v_current_ay_id, v_current_starts, v_current_ends
    FROM academic_years
    WHERE CURRENT_DATE BETWEEN starts_on AND ends_on
    ORDER BY starts_on DESC
    LIMIT 1;

    IF v_current_ay_id IS NULL THEN
        SELECT id, starts_on, ends_on
        INTO v_current_ay_id, v_current_starts, v_current_ends
        FROM academic_years
        ORDER BY starts_on DESC
        LIMIT 1;
    END IF;

    IF v_current_ay_id IS NULL THEN
        RAISE EXCEPTION 'No academic year rows found.';
    END IF;

    v_attendance_seed_end := LEAST(CURRENT_DATE, v_current_ends);
    IF v_attendance_seed_end < v_current_starts THEN
        v_attendance_seed_end := v_current_starts;
    END IF;

    INSERT INTO enrolments (student_id, class_id, academic_year_id, start_date, end_date, created_at, updated_at)
    SELECT s.id, v_attendance_class_id, v_current_ay_id, v_current_starts, NULL::DATE, NOW(), NOW()
    FROM students s
    WHERE s.upn IN (
        'UPNATT0000000001',
        'UPNATT0000000002',
        'UPNATT0000000003',
        'UPNATT0000000004',
        'UPNATT0000000005'
    )
    ON CONFLICT (student_id, class_id, academic_year_id) DO UPDATE
    SET start_date = EXCLUDED.start_date,
        end_date = NULL,
        updated_at = NOW();

    INSERT INTO enrolments (student_id, class_id, academic_year_id, start_date, end_date, created_at, updated_at)
    SELECT s.id, v_email_class_id, v_current_ay_id, v_current_starts, NULL::DATE, NOW(), NOW()
    FROM students s
    WHERE s.upn IN ('UPNEML0000000001', 'UPNEML0000000002')
    ON CONFLICT (student_id, class_id, academic_year_id) DO UPDATE
    SET start_date = EXCLUDED.start_date,
        end_date = NULL,
        updated_at = NOW();

    INSERT INTO guardians (
        first_name, last_name, email, phone,
        address_line_1, address_line_2, city, postcode,
        created_at, updated_at
    )
    SELECT
        'Jacob', 'Wilkins', 'jacobwilkins820@gmail.com', '07123456780',
        '10 School Lane', NULL, 'Preston', 'PR1 1AA',
        NOW(), NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM guardians g WHERE LOWER(g.email) = 'jacobwilkins820@gmail.com'
    );

    INSERT INTO guardians (
        first_name, last_name, email, phone,
        address_line_1, address_line_2, city, postcode,
        created_at, updated_at
    )
    SELECT
        'Jake', 'Wilkins', 'jake.wilkins.test@gmail.com', '07123456781',
        '11 School Lane', NULL, 'Preston', 'PR1 1AB',
        NOW(), NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM guardians g WHERE LOWER(g.email) = 'jake.wilkins.test@gmail.com'
    );

    SELECT id
    INTO v_guardian_1_id
    FROM guardians
    WHERE LOWER(email) = 'jacobwilkins820@gmail.com'
    ORDER BY id
    LIMIT 1;

    SELECT id
    INTO v_guardian_2_id
    FROM guardians
    WHERE LOWER(email) = 'jake.wilkins.test@gmail.com'
    ORDER BY id
    LIMIT 1;

    IF v_guardian_1_id IS NULL OR v_guardian_2_id IS NULL THEN
        RAISE EXCEPTION 'Required guardian records were not found.';
    END IF;

    INSERT INTO users (
        role_id, linked_guardian_id, first_name, last_name, email,
        password_hash, enabled, created_at, updated_at
    )
    SELECT
        v_parent_role_id,
        v_guardian_1_id,
        'Jacob',
        'Wilkins',
        'jacobwilkins820@gmail.com',
        crypt('Password123!', gen_salt('bf', 10)),
        TRUE,
        NOW(),
        NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM users u WHERE LOWER(u.email) = 'jacobwilkins820@gmail.com'
    );

    INSERT INTO users (
        role_id, linked_guardian_id, first_name, last_name, email,
        password_hash, enabled, created_at, updated_at
    )
    SELECT
        v_parent_role_id,
        v_guardian_2_id,
        'Jake',
        'Wilkins',
        'jake.wilkins.test@gmail.com',
        crypt('Password123!', gen_salt('bf', 10)),
        TRUE,
        NOW(),
        NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM users u WHERE LOWER(u.email) = 'jake.wilkins.test@gmail.com'
    );

    UPDATE users
    SET linked_guardian_id = v_guardian_1_id,
        updated_at = NOW()
    WHERE LOWER(email) = 'jacobwilkins820@gmail.com'
      AND role_id = v_parent_role_id
      AND linked_guardian_id IS DISTINCT FROM v_guardian_1_id;

    UPDATE users
    SET linked_guardian_id = v_guardian_2_id,
        updated_at = NOW()
    WHERE LOWER(email) = 'jake.wilkins.test@gmail.com'
      AND role_id = v_parent_role_id
      AND linked_guardian_id IS DISTINCT FROM v_guardian_2_id;

    INSERT INTO student_guardians (student_id, guardian_id, relationship, is_primary)
    SELECT s.id, v_guardian_1_id, 'Parent', TRUE
    FROM students s
    WHERE s.upn = 'UPNEML0000000001'
    ON CONFLICT (student_id, guardian_id) DO UPDATE
    SET relationship = EXCLUDED.relationship,
        is_primary = EXCLUDED.is_primary;

    INSERT INTO student_guardians (student_id, guardian_id, relationship, is_primary)
    SELECT s.id, v_guardian_2_id, 'Parent', TRUE
    FROM students s
    WHERE s.upn = 'UPNEML0000000002'
    ON CONFLICT (student_id, guardian_id) DO UPDATE
    SET relationship = EXCLUDED.relationship,
        is_primary = EXCLUDED.is_primary;

    UPDATE student_guardians sg
    SET is_primary = FALSE
    FROM students s
    WHERE sg.student_id = s.id
      AND s.upn = 'UPNEML0000000001'
      AND sg.guardian_id <> v_guardian_1_id
      AND sg.is_primary = TRUE;

    UPDATE student_guardians sg
    SET is_primary = FALSE
    FROM students s
    WHERE sg.student_id = s.id
      AND s.upn = 'UPNEML0000000002'
      AND sg.guardian_id <> v_guardian_2_id
      AND sg.is_primary = TRUE;

    INSERT INTO attendance_sessions (academic_year_id, class_id, session_date, session)
    SELECT
        v_current_ay_id,
        v_attendance_class_id,
        d.session_date,
        sp.session
    FROM (
        SELECT gs::DATE AS session_date
        FROM generate_series(v_current_starts::timestamp, v_attendance_seed_end::timestamp, INTERVAL '1 day') gs
        WHERE EXTRACT(ISODOW FROM gs) BETWEEN 1 AND 5
    ) d
    CROSS JOIN (VALUES ('AM'), ('PM')) AS sp(session)
    ON CONFLICT (class_id, session_date, session) DO NOTHING;

    INSERT INTO attendance_records (
        attendance_session_id,
        student_id,
        status,
        status_reason,
        marked_at,
        created_at,
        updated_at
    )
    WITH attendance_seed AS (
        SELECT
            ses.id AS attendance_session_id,
            stu.id AS student_id,
            ses.session_date,
            ses.session,
            get_byte(decode(md5(ses.id::text), 'hex'), 0) AS session_seed,
            (
                (
                    get_byte(decode(md5(ses.id::text || ':' || stu.id::text), 'hex'), 0) * 256
                    + get_byte(decode(md5(ses.id::text || ':' || stu.id::text), 'hex'), 1)
                ) % 100
            ) AS student_roll
        FROM (
            SELECT s.id
            FROM students s
            WHERE s.upn IN (
                'UPNATT0000000001',
                'UPNATT0000000002',
                'UPNATT0000000003',
                'UPNATT0000000004',
                'UPNATT0000000005'
            )
        ) stu
        CROSS JOIN (
            SELECT
                ses_inner.id,
                ses_inner.session_date,
                ses_inner.session
            FROM attendance_sessions ses_inner
            WHERE ses_inner.class_id = v_attendance_class_id
              AND ses_inner.academic_year_id = v_current_ay_id
        ) ses
    ),
    scored_attendance AS (
        SELECT
            attendance_session_id,
            student_id,
            session_date,
            session,
            student_roll,
            (10 + (session_seed % 21)) AS absent_cutoff,
            (10 + (session_seed % 21)) + (5 + ((session_seed / 3) % 16)) AS late_cutoff
        FROM attendance_seed
    )
    SELECT
        attendance_session_id,
        student_id,
        CASE
            WHEN student_roll < absent_cutoff THEN 'ABSENT'
            WHEN student_roll < late_cutoff THEN 'LATE'
            ELSE 'PRESENT'
        END AS status,
        CASE
            WHEN student_roll < absent_cutoff THEN 'Illness'
            WHEN student_roll < late_cutoff THEN 'Late arrival'
            ELSE NULL
        END AS status_reason,
        (session_date::timestamp + CASE session WHEN 'AM' THEN INTERVAL '09:00' ELSE INTERVAL '13:00' END),
        NOW(),
        NOW()
    FROM scored_attendance
    ON CONFLICT (attendance_session_id, student_id) DO UPDATE
    SET status = EXCLUDED.status,
        status_reason = EXCLUDED.status_reason,
        marked_at = EXCLUDED.marked_at,
        updated_at = NOW();
END $$;
