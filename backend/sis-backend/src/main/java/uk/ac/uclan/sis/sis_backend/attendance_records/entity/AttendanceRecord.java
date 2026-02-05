package uk.ac.uclan.sis.sis_backend.attendance_records.entity;

import jakarta.persistence.*;
import uk.ac.uclan.sis.sis_backend.attendance_records.AttendanceStatus;
import uk.ac.uclan.sis.sis_backend.attendance_sessions.entity.AttendanceSession;
import uk.ac.uclan.sis.sis_backend.students.entity.Student;
import uk.ac.uclan.sis.sis_backend.users.entity.User;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "attendance_records",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_attendance_session_student",
                        columnNames = {"attendance_session_id", "student_id"}
                )
        }
)
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "attendance_session_id", nullable = false)
    private AttendanceSession attendanceSession;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "marked_by_user_id")
    private User markedByUser;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttendanceStatus status;

    @Column(name = "status_reason", length = 255)
    private String reason;

    private LocalDateTime markedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Sets audit timestamps on insert.
     */
    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    /**
     * Updates the audit timestamp on update.
     */
    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Returns the attendance record id.
     *
     * @return attendance record id
     */
    public Long getId() {
        return id;
    }

    /**
     * Returns the attendance session entity.
     *
     * @return attendance session entity
     */
    public AttendanceSession getAttendanceSession() {
        return attendanceSession;
    }

    /**
     * Sets the attendance session entity.
     *
     * @param attendanceSession attendance session entity
     */
    public void setAttendanceSession(AttendanceSession attendanceSession) {
        this.attendanceSession = attendanceSession;
    }

    /**
     * Returns the student entity.
     *
     * @return student entity
     */
    public Student getStudent() {
        return student;
    }

    /**
     * Sets the student entity.
     *
     * @param student student entity
     */
    public void setStudent(Student student) {
        this.student = student;
    }

    /**
     * Returns the user who marked the record.
     *
     * @return marking user
     */
    public User getMarkedByUser() {
        return markedByUser;
    }

    /**
     * Sets the user who marked the record.
     *
     * @param markedByUser marking user
     */
    public void setMarkedByUser(User markedByUser) {
        this.markedByUser = markedByUser;
    }

    /**
     * Returns the attendance status.
     *
     * @return attendance status
     */
    public AttendanceStatus getStatus() {
        return status;
    }

    /**
     * Sets the attendance status.
     *
     * @param status attendance status
     */
    public void setStatus(AttendanceStatus status) {
        this.status = status;
    }

    /**
     * Returns the status reason.
     *
     * @return status reason
     */
    public String getReason() {
        return reason;
    }

    /**
     * Sets the status reason.
     *
     * @param reason status reason
     */
    public void setReason(String reason) {
        this.reason = reason;
    }

    /**
     * Returns the marked timestamp.
     *
     * @return marked timestamp
     */
    public LocalDateTime getMarkedAt() {
        return markedAt;
    }

    /**
     * Sets the marked timestamp.
     *
     * @param markedAt marked timestamp
     */
    public void setMarkedAt(LocalDateTime markedAt) {
        this.markedAt = markedAt;
    }

    /**
     * Returns the created timestamp.
     *
     * @return created timestamp
     */
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    /**
     * Returns the updated timestamp.
     *
     * @return updated timestamp
     */
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
