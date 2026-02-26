package uk.ac.uclan.sis.sis_backend.classes.dto;

public class UpdateClassRequest {

    // dev note: if teacherId is provided as null , that means "unassign teacher"
    private Long teacherId;

    private String name;
    private String code;
    private Boolean active;

    public UpdateClassRequest() {}

    public Long getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(Long teacherId) {
        this.teacherId = teacherId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
