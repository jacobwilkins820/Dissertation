package uk.ac.uclan.sis.sis_backend.guardians.dto;

public class GuardianContactResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;

    public GuardianContactResponse() {}

    public GuardianContactResponse(Long id, String firstName, String lastName, String email, String phone) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
    }

    public Long getId() { return id; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
}
