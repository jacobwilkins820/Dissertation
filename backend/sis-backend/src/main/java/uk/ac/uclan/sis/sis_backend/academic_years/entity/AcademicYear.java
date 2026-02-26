package uk.ac.uclan.sis.sis_backend.academic_years.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "academic_years")
public class AcademicYear {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String name;

    @Column(name = "starts_on", nullable = false)
    private LocalDate startsOn;

    @Column(name = "ends_on", nullable = false)
    private LocalDate endsOn;

    /**
     * Creates an academic year entity for JPA.
     */
    protected AcademicYear() {}

    /**
     * Creates an academic year entity.
     *
     * @param name academic year name
     * @param startsOn start date
     * @param endsOn end date
     */
    public AcademicYear(String name, LocalDate startsOn, LocalDate endsOn) {
        this.name = name;
        this.startsOn = startsOn;
        this.endsOn = endsOn;
    }

    /**
     * Gets the academic year id.
     *
     * @return academic year id
     */
    public Long getId() {
        return id;
    }

    /**
     * Gets the academic year name.
     *
     * @return academic year name
     */
    public String getName() {
        return name;
    }

    /**
     * Gets the start date.
     *
     * @return start date
     */
    public LocalDate getStartsOn() {
        return startsOn;
    }

    /**
     * Gets the end date.
     *
     * @return end date
     */
    public LocalDate getEndsOn() {
        return endsOn;
    }
}
