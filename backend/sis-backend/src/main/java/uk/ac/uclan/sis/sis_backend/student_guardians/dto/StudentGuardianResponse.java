package uk.ac.uclan.sis.sis_backend.student_guardians.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Return names + a couple of useful fields.
 */
public class StudentGuardianResponse {

    public StudentGuardianResponse() {}

    private Long studentId;
    private Long guardianId;
    private String studentFirstName;
    private String studentLastName;
    private String guardianFirstName;
    private String guardianLastName;

    private String relationship;
    private boolean isPrimary;

    public StudentGuardianResponse(Long studentId, Long guardianId, String studentFirstName, String studentLastName, String guardianFirstName, String guardianLastName, String relationship, boolean isPrimary) {
        this.studentId = studentId;
        this.guardianId = guardianId;
        this.studentFirstName = studentFirstName;
        this.studentLastName = studentLastName;
        this.guardianFirstName = guardianFirstName;
        this.guardianLastName = guardianLastName;
        this.relationship = relationship;
        this.isPrimary = isPrimary;
    }

    public Long getStudentId() {
        return studentId;
    }

    public Long getGuardianId() {
        return guardianId;
    }

    public String getStudentFirstName() {
        return studentFirstName;
    }

    public String getStudentLastName() {
        return studentLastName;
    }

    public String getGuardianFirstName() {
        return guardianFirstName;
    }

    public String getGuardianLastName() {
        return guardianLastName;
    }

    public String getRelationship() {
        return relationship;
    }

    @JsonProperty("isPrimary")
    public boolean isPrimary() {
        return isPrimary;
    }
}
