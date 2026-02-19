package uk.ac.uclan.sis.sis_backend.attendance_records.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import uk.ac.uclan.sis.sis_backend.academic_years.entity.AcademicYear;
import uk.ac.uclan.sis.sis_backend.academic_years.repository.AcademicYearRepository;
import uk.ac.uclan.sis.sis_backend.attendance_records.AttendanceStatus;
import uk.ac.uclan.sis.sis_backend.attendance_records.entity.AttendanceRecord;
import uk.ac.uclan.sis.sis_backend.attendance_records.repository.AttendanceRecordRepository;
import uk.ac.uclan.sis.sis_backend.attendance_sessions.entity.AttendanceSession;
import uk.ac.uclan.sis.sis_backend.attendance_sessions.enums.SessionPart;
import uk.ac.uclan.sis.sis_backend.attendance_sessions.repository.AttendanceSessionRepository;
import uk.ac.uclan.sis.sis_backend.classes.entity.Class;
import uk.ac.uclan.sis.sis_backend.classes.repository.ClassRepository;
import uk.ac.uclan.sis.sis_backend.enrolments.entity.Enrolment;
import uk.ac.uclan.sis.sis_backend.enrolments.repository.EnrolmentRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Component
public class AttendanceMockDataSeeder {

    private static final Logger log = LoggerFactory.getLogger(AttendanceMockDataSeeder.class);

    private final AcademicYearRepository academicYearRepository;
    private final ClassRepository classRepository;
    private final EnrolmentRepository enrolmentRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;

    /**
     * Creates the attendance mock data seeder.
     *
     * @param academicYearRepository repository for academic years
     * @param classRepository repository for classes
     * @param enrolmentRepository repository for enrolments
     * @param attendanceSessionRepository repository for attendance sessions
     * @param attendanceRecordRepository repository for attendance records
     */
    public AttendanceMockDataSeeder(
            AcademicYearRepository academicYearRepository,
            ClassRepository classRepository,
            EnrolmentRepository enrolmentRepository,
            AttendanceSessionRepository attendanceSessionRepository,
            AttendanceRecordRepository attendanceRecordRepository
    ) {
        this.academicYearRepository = academicYearRepository;
        this.classRepository = classRepository;
        this.enrolmentRepository = enrolmentRepository;
        this.attendanceSessionRepository = attendanceSessionRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
    }

    /**
     * Refreshes attendance mock data when the application starts.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void refreshMockAttendance() {
        LocalDate today = LocalDate.now();
        AcademicYear academicYear = academicYearRepository.findByDate(today).orElse(null);

        if (academicYear == null) {
            log.info("Skipping attendance mock refresh: no academic year for {}", today);
            return;
        }

        List<Class> classes = classRepository.findAll();
        if (classes.isEmpty()) {
            log.info("Skipping attendance mock refresh: no classes available");
            return;
        }

        int sessionsProcessed = 0;
        int recordsWritten = 0;

        for (Class clazz : classes) {
            AttendanceSession amSession = getOrCreateSession(academicYear, clazz, today, SessionPart.AM);
            AttendanceSession pmSession = getOrCreateSession(academicYear, clazz, today, SessionPart.PM);

            recordsWritten += upsertRandomRecordsForSession(amSession, academicYear.getId(), today);
            recordsWritten += upsertRandomRecordsForSession(pmSession, academicYear.getId(), today);
            sessionsProcessed += 2;
        }

        log.info(
                "Attendance mock refresh complete for {}: {} sessions processed, {} records updated",
                today,
                sessionsProcessed,
                recordsWritten
        );
    }

    private AttendanceSession getOrCreateSession(
            AcademicYear academicYear,
            Class clazz,
            LocalDate date,
            SessionPart part
    ) {
        return attendanceSessionRepository
                .findByClazz_IdAndSessionDateAndSession(clazz.getId(), date, part)
                .orElseGet(() -> attendanceSessionRepository.save(
                        new AttendanceSession(academicYear, clazz, date, part)
                ));
    }

    private int upsertRandomRecordsForSession(
            AttendanceSession session,
            Long academicYearId,
            LocalDate today
    ) {
        List<Enrolment> enrolments = enrolmentRepository
                .findByClazz_IdAndAcademicYear_IdOrderByIdAsc(session.getClazz().getId(), academicYearId)
                .stream()
                .filter(e -> isActiveOnDate(e, today))
                .toList();

        for (Enrolment enrolment : enrolments) {
            AttendanceRecord record = attendanceRecordRepository
                    .findByAttendanceSession_IdAndStudent_Id(session.getId(), enrolment.getStudent().getId())
                    .orElseGet(() -> {
                        AttendanceRecord fresh = new AttendanceRecord();
                        fresh.setAttendanceSession(session);
                        fresh.setStudent(enrolment.getStudent());
                        return fresh;
                    });

            record.setStatus(randomStatus());
            record.setReason(null);
            record.setMarkedAt(LocalDateTime.now());
            attendanceRecordRepository.save(record);
        }

        return enrolments.size();
    }

    private boolean isActiveOnDate(Enrolment enrolment, LocalDate date) {
        return !enrolment.getStartDate().isAfter(date)
                && (enrolment.getEndDate() == null || !enrolment.getEndDate().isBefore(date));
    }

    private AttendanceStatus randomStatus() {
        return switch (ThreadLocalRandom.current().nextInt(3)) {
            case 0 -> AttendanceStatus.PRESENT;
            case 1 -> AttendanceStatus.LATE;
            default -> AttendanceStatus.ABSENT;
        };
    }
}
