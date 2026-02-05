package uk.ac.uclan.sis.sis_backend.users.entity;

import jakarta.persistence.*;
import java.time.Instant;
import uk.ac.uclan.sis.sis_backend.roles.entity.Role;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = true, unique = false, length = 255, name = "linked_guardian_id")
    private Long linkedGuardianId;

    @Column(nullable = false, unique = false, length = 255)
    private String firstName;

    @Column(nullable = false, unique = false, length = 255)
    private String lastName;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(nullable = false)
    private boolean enabled = true;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    /**
     * Returns the role for the user.
     *
     * @return role entity
     */
    public Role getRole() {
        return role;
    }

    /**
     * Sets the role for the user.
     *
     * @param role role entity
     */
    public void setRole(Role role) {
        this.role = role;
    }

    /**
     * Returns the linked guardian id.
     *
     * @return linked guardian id
     */
    public Long getLinkedGuardianId() {
        return linkedGuardianId;
    }

    /**
     * Sets the linked guardian id.
     *
     * @param linkedGuardianId linked guardian id
     */
    public void setLinkedGuardianId(Long linkedGuardianId) {
        this.linkedGuardianId = linkedGuardianId;
    }

    /**
     * Returns the user id.
     *
     * @return user id
     */
    public Long getId() {
        return id;
    }

    /**
     * Sets the user id.
     *
     * @param id user id
     */
    public void setId(Long id) {
        this.id = id;
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
     * Returns the password hash.
     *
     * @return password hash
     */
    public String getPasswordHash() {
        return passwordHash;
    }

    /**
     * Sets the password hash.
     *
     * @param passwordHash password hash
     */
    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    /**
     * Returns whether the user is enabled.
     *
     * @return true when enabled
     */
    public boolean isEnabled() {
        return enabled;
    }

    /**
     * Sets whether the user is enabled.
     *
     * @param enabled enabled flag
     */
    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
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
     * Sets the created timestamp.
     *
     * @param createdAt created timestamp
     */
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    /**
     * Returns the updated timestamp.
     *
     * @return updated timestamp
     */
    public Instant getUpdatedAt() {
        return updatedAt;
    }

    /**
     * Sets the updated timestamp.
     *
     * @param updatedAt updated timestamp
     */
    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
