package uk.ac.uclan.sis.sis_backend.student.dto;

public class StudentResponse {

    private Long id;
    private String firstName;
    private String lastName;

    public StudentResponse(Long id, String firstName, String lastName) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public Long getId() { return id; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
}
