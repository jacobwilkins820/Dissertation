package uk.ac.uclan.sis.sis_backend.classes.dto;

public class ClassListItemResponse {

    private Long id;
    private String name;
    private String code;
    private boolean active;

    public ClassListItemResponse() {}

    public ClassListItemResponse(Long id, String name, String code, boolean active) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.active = active;
    }

    public Long getId() {
        return id;
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
