package uk.ac.uclan.sis.sis_backend.classes.entity;

import jakarta.persistence.*;
import uk.ac.uclan.sis.sis_backend.users.entity.User;

@Entity
@Table(name = "classes")
public class Class {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Teacher is optional to allow unassignment when staffing changes.
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "teacher_id", foreignKey = @ForeignKey(name = "fk_classes_teacher_id"))
    private User teacher;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "code", unique = true, length = 20)
    private String code;

    // Class rows can remain while being marked inactive for history.
    @Column(name = "active", nullable = false)
    private boolean active = true;

    /**
     * Gets the class id.
     *
     * @return class id
     */
    public Long getId() {
        return id;
    }

    /**
     * Gets the teacher user.
     *
     * @return teacher user
     */
    public User getTeacher() {
        return teacher;
    }

    /**
     * Sets the teacher user.
     *
     * @param teacher teacher user
     */
    public void setTeacher(User teacher) {
        this.teacher = teacher;
    }

    /**
     * Gets the class name.
     *
     * @return class name
     */
    public String getName() {
        return name;
    }

    /**
     * Sets the class name.
     *
     * @param name class name
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * Gets the class code.
     *
     * @return class code
     */
    public String getCode() {
        return code;
    }

    /**
     * Sets the class code.
     *
     * @param code class code
     */
    public void setCode(String code) {
        this.code = code;
    }

    /**
     * Gets whether the class is active.
     *
     * @return true when active
     */
    public boolean isActive() {
        return active;
    }

    /**
     * Sets whether the class is active.
     *
     * @param active active flag
     */
    public void setActive(boolean active) {
        this.active = active;
    }
}
