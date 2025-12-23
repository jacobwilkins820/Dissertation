package uk.ac.uclan.sis.sis_backend.student_guardians.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Used for both create + update of the link metadata.
 */
public class UpsertStudentGuardianLinkRequest {

    @NotBlank
    @Size(max = 50)
    private String relationship;

    private Boolean isPrimary;

    public String getRelationship() {
        return relationship;
    }

    public void setRelationship(String relationship) {
        this.relationship = relationship;
    }

    public Boolean getIsPrimary() {
        return isPrimary;
    }

    public void setIsPrimary(Boolean primary) {
        isPrimary = primary;
    }
}
