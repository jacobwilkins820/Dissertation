package uk.ac.uclan.sis.sis_backend.roles.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "roles")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(name = "permission_level", nullable = false)
    private int permissionLevel;

    /**
     * Creates a role entity for JPA.
     */
    protected Role() { }

    /**
     * Creates a role entity.
     *
     * @param name role name
     * @param permissionLevel permission bitmask
     */
    public Role(String name, int permissionLevel) {
        this.name = name;
        this.permissionLevel = permissionLevel;
    }

    /**
     * Returns the role id.
     *
     * @return role id
     */
    public Long getId() {
        return id;
    }

    /**
     * Returns the role name.
     *
     * @return role name
     */
    public String getName() {
        return name;
    }

    /**
     * Returns the permission bitmask.
     *
     * @return permission level
     */
    public int getPermissionLevel() {
        return permissionLevel;
    }

    /**
     * Sets the role name.
     *
     * @param name role name
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * Sets the permission bitmask.
     *
     * @param permissionLevel permission level
     */
    public void setPermissionLevel(int permissionLevel) {
        this.permissionLevel = permissionLevel;
    }
}
