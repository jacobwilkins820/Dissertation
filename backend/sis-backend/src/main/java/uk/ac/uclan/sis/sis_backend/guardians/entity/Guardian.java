package uk.ac.uclan.sis.sis_backend.guardians.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Guardian is a person who can be linked to one or more students.
 *
 * Keep this entity "guardian-only". The join-specific fields live in StudentGuardian.
 */
@Entity
@Table(
        name = "guardians",
        indexes = {
                @Index(name = "idx_guardians_email", columnList = "email"),
                @Index(name = "idx_guardians_phone", columnList = "phone")
        }
)
public class Guardian {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Basic identity fields. Keep them non-null for data quality.
    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    // Contact info. Email is optional (some schools only have phone).
    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "phone", length = 50)
    private String phone;

    // Optional address fields
    @Column(name = "address_line_1", length = 255)
    private String addressLine1;

    @Column(name = "address_line_2", length = 255)
    private String addressLine2;

    @Column(name = "city", length = 120)
    private String city;

    @Column(name = "postcode", length = 20)
    private String postcode;

    // Audit fields.
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Sets audit timestamps on insert.
     */
    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    /**
     * Updates the audit timestamp on update.
     */
    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    /**
     * Creates a guardian entity for JPA.
     */
    public Guardian() {}

    // --- getters/setters ---

    /**
     * Returns the guardian id.
     *
     * @return guardian id
     */
    public Long getId() {
        return id;
    }

    /**
     * Returns the first name.
     *
     * @return first name
     */
    public String getFirstName() {
        return firstName;
    }

    /**
     * Sets the first name.
     *
     * @param firstName first name
     */
    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    /**
     * Returns the last name.
     *
     * @return last name
     */
    public String getLastName() {
        return lastName;
    }

    /**
     * Sets the last name.
     *
     * @param lastName last name
     */
    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    /**
     * Returns the email address.
     *
     * @return email address
     */
    public String getEmail() {
        return email;
    }

    /**
     * Sets the email address.
     *
     * @param email email address
     */
    public void setEmail(String email) {
        this.email = email;
    }

    /**
     * Returns the phone number.
     *
     * @return phone number
     */
    public String getPhone() {
        return phone;
    }

    /**
     * Sets the phone number.
     *
     * @param phone phone number
     */
    public void setPhone(String phone) {
        this.phone = phone;
    }

    /**
     * Returns address line 1.
     *
     * @return address line 1
     */
    public String getAddressLine1() {
        return addressLine1;
    }

    /**
     * Sets address line 1.
     *
     * @param addressLine1 address line 1
     */
    public void setAddressLine1(String addressLine1) {
        this.addressLine1 = addressLine1;
    }

    /**
     * Returns address line 2.
     *
     * @return address line 2
     */
    public String getAddressLine2() {
        return addressLine2;
    }

    /**
     * Sets address line 2.
     *
     * @param addressLine2 address line 2
     */
    public void setAddressLine2(String addressLine2) {
        this.addressLine2 = addressLine2;
    }

    /**
     * Returns the city.
     *
     * @return city
     */
    public String getCity() {
        return city;
    }

    /**
     * Sets the city.
     *
     * @param city city
     */
    public void setCity(String city) {
        this.city = city;
    }

    /**
     * Returns the postcode.
     *
     * @return postcode
     */
    public String getPostcode() {
        return postcode;
    }

    /**
     * Sets the postcode.
     *
     * @param postcode postcode
     */
    public void setPostcode(String postcode) {
        this.postcode = postcode;
    }

    /**
     * Returns the created timestamp.
     *
     * @return created timestamp
     */
    public Instant getCreatedAt() {
        return createdAt;
    }

    /**
     * Returns the updated timestamp.
     *
     * @return updated timestamp
     */
    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
