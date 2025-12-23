package uk.ac.uclan.sis.sis_backend.classes.entity;

import jakarta.persistence.*;
import uk.ac.uclan.sis.sis_backend.users.entity.User;

@Entity
@Table(name = "classes")
public class Class {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // dev note: teacher is optional - we want to be able to unassign when class is inactive / staff changes
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "teacher_id", foreignKey = @ForeignKey(name = "fk_classes_teacher_id"))
    private User teacher;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "code", unique = true, length = 20)
    private String code;

    // dev note: can keep the class row but mark it inactive for history/audit
    @Column(name = "active", nullable = false)
    private boolean active = true;

    public Long getId() {
        return id;
    }

    public User getTeacher() {
        return teacher;
    }

    public void setTeacher(User teacher) {
        this.teacher = teacher;
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

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
