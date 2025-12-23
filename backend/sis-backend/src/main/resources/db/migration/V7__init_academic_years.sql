-- V7__init_academic_years.sql
-- Creates academic_years table and seeds a few sensible rows.

CREATE TABLE IF NOT EXISTS academic_years (
    id        BIGSERIAL PRIMARY KEY,
    name      VARCHAR(20) NOT NULL UNIQUE,          -- e.g. '2024/25'
    starts_on DATE NOT NULL,
    ends_on   DATE NOT NULL,
    CONSTRAINT chk_academic_year_dates CHECK (ends_on > starts_on)
);

CREATE INDEX IF NOT EXISTS idx_academic_years_starts_on ON academic_years(starts_on);
CREATE INDEX IF NOT EXISTS idx_academic_years_ends_on ON academic_years(ends_on);

-- Seed. UK academic year typically starts around Sept 1.
INSERT INTO academic_years (name, starts_on, ends_on)
VALUES
  ('2023/24', DATE '2023-09-01', DATE '2024-08-31'),
  ('2024/25', DATE '2024-09-01', DATE '2025-08-31'),
  ('2025/26', DATE '2025-09-01', DATE '2026-08-31')
ON CONFLICT (name) DO NOTHING;
