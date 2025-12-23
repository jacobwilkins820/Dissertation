package uk.ac.uclan.sis.sis_backend.students.entity;

/**
 * Student lifecycle status in the system.
 * Using an enum stops random strings ("Actve", "WITHDRAW") ending up in the DB.
 */
public enum StudentStatus {
    ACTIVE,
    INACTIVE,
    WITHDRAWN
}