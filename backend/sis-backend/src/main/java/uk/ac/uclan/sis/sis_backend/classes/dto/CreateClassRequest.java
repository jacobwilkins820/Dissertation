package uk.ac.uclan.sis.sis_backend.classes.dto;

public class CreateClassRequest {

    // dev note: teacherId is optional - a class can exist before staffing is finalised
    private Long teacherId;

    private String name;
    private String code;
    private Boolean active;

    public CreateClassRequest() {}

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
