package uk.ac.uclan.sis.sis_backend.student_guardians.dto;

/**
 * Return names + a couple of useful fields.
 */
public class StudentGuardianResponse {

    private String studentFirstName;
    private String studentLastName;
    private String guardianFirstName;
    private String guardianLastName;

    private String relationship;
    private boolean isPrimary;

    public StudentGuardianResponse(String studentFirstName, String studentLastName, String guardianFirstName, String guardianLastName, String relationship, boolean isPrimary) {
        this.studentFirstName = studentFirstName;
        this.studentLastName = studentLastName;
        this.guardianFirstName = guardianFirstName;
        this.guardianLastName = guardianLastName;
        this.relationship = relationship;
        this.isPrimary = isPrimary;
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

    public boolean isPrimary() {
        return isPrimary;
    }
}
