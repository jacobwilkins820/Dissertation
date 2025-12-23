package uk.ac.uclan.sis.sis_backend.guardians.dto;

import java.time.Instant;

public class GuardianResponse {

    private Long id;

    private String firstName;
    private String lastName;

    private String email;
    private String phone;

    private String addressLine1;
    private String addressLine2;
    private String city;
    private String postcode;

    private Instant createdAt;
    private Instant updatedAt;

    public GuardianResponse() {}

    public GuardianResponse(
            Long id,
            String firstName,
            String lastName,
            String email,
            String phone,
            String addressLine1,
            String addressLine2,
            String city,
            String postcode,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
        this.addressLine1 = addressLine1;
        this.addressLine2 = addressLine2;
        this.city = city;
        this.postcode = postcode;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getAddressLine1() { return addressLine1; }
    public String getAddressLine2() { return addressLine2; }
    public String getCity() { return city; }
    public String getPostcode() { return postcode; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
