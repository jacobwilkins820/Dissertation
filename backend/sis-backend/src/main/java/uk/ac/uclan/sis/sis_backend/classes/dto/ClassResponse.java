package uk.ac.uclan.sis.sis_backend.classes.dto;

public class ClassResponse {

    private Long id;

    private Long teacherId; // nullable
    private String teacherName; // nullable convenience field for UI

    private String name;
    private String code;
    private boolean active;

    public ClassResponse() {}

    public ClassResponse(Long id, Long teacherId, String teacherName, String name, String code, boolean active) {
        this.id = id;
        this.teacherId = teacherId;
        this.teacherName = teacherName;
        this.name = name;
        this.code = code;
        this.active = active;
    }

    public Long getId() {
        return id;
    }

    public Long getTeacherId() {
        return teacherId;
    }

    public String getTeacherName() {
        return teacherName;
    }

    public String getName() {
        return name;
    }

    public String getCode() {
        return code;
    }

    public boolean isActive() {
        return active;
    }
}
