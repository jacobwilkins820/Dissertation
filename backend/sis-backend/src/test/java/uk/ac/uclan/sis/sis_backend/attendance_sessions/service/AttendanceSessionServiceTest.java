package uk.ac.uclan.sis.sis_backend.attendance_sessions.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.util.ReflectionTestUtils;
import uk.ac.uclan.sis.sis_backend.academic_years.entity.AcademicYear;
import uk.ac.uclan.sis.sis_backend.academic_years.service.AcademicYearService;
import uk.ac.uclan.sis.sis_backend.attendance_sessions.dto.AttendanceSessionResponse;
import uk.ac.uclan.sis.sis_backend.attendance_sessions.dto.CreateAttendanceSessionRequest;
import uk.ac.uclan.sis.sis_backend.attendance_sessions.entity.AttendanceSession;
import uk.ac.uclan.sis.sis_backend.attendance_sessions.enums.SessionPart;
import uk.ac.uclan.sis.sis_backend.attendance_sessions.repository.AttendanceSessionRepository;
import uk.ac.uclan.sis.sis_backend.classes.entity.Class;
import uk.ac.uclan.sis.sis_backend.classes.repository.ClassRepository;
import uk.ac.uclan.sis.sis_backend.common.exception.NotFoundException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AttendanceSessionServiceTest {

    @Mock
    private AttendanceSessionRepository attendanceSessionRepository;

    @Mock
    private AcademicYearService academicYearService;

    @Mock
    private ClassRepository classRepository;

    @InjectMocks
    private AttendanceSessionService service;

    @Test
    void create_missingRequiredFieldsThrows() {
        CreateAttendanceSessionRequest req = buildRequest(null, LocalDate.now(), SessionPart.AM);

        assertThrows(IllegalArgumentException.class, () -> service.create(req));
    }

    @Test
    void create_missingClassThrows() {
        CreateAttendanceSessionRequest req = buildRequest(1L, LocalDate.now(), SessionPart.AM);

        when(classRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.create(req));
    }

    @Test
    void create_duplicateThrows() {
        CreateAttendanceSessionRequest req = buildRequest(1L, LocalDate.of(2024, 9, 1), SessionPart.PM);

        Class clazz = mock(Class.class);
        AcademicYear ay = mock(AcademicYear.class);

        when(classRepository.findById(1L)).thenReturn(Optional.of(clazz));
        when(academicYearService.getForDateOrThrow(LocalDate.of(2024, 9, 1))).thenReturn(ay);
        when(attendanceSessionRepository.save(any(AttendanceSession.class)))
                .thenThrow(new DataIntegrityViolationException("dup"));

        assertThrows(IllegalArgumentException.class, () -> service.create(req));
    }

    @Test
    void create_successReturnsResponse() {
        LocalDate date = LocalDate.of(2024, 9, 1);
        CreateAttendanceSessionRequest req = buildRequest(5L, date, SessionPart.AM);

        Class clazz = mock(Class.class);
        AcademicYear ay = mock(AcademicYear.class);
        when(clazz.getId()).thenReturn(5L);
        when(ay.getId()).thenReturn(9L);
        when(ay.getName()).thenReturn("2024-2025");

        when(classRepository.findById(5L)).thenReturn(Optional.of(clazz));
        when(academicYearService.getForDateOrThrow(date)).thenReturn(ay);
        when(attendanceSessionRepository.save(any(AttendanceSession.class))).thenAnswer(invocation -> {
            AttendanceSession saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 77L);
            return saved;
        });

        AttendanceSessionResponse response = service.create(req);

        assertEquals(77L, response.getId());
        assertEquals(5L, response.getClassId());
        assertEquals(9L, response.getAcademicYearId());
        assertEquals("2024-2025", response.getAcademicYearName());
        assertEquals(date, response.getSessionDate());
        assertEquals(SessionPart.AM, response.getSession());
    }

    @Test
    void getById_missingThrows() {
        when(attendanceSessionRepository.findById(44L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.getById(44L));
    }

    @Test
    void getById_returnsResponse() {
        Class clazz = mock(Class.class);
        AcademicYear ay = mock(AcademicYear.class);
        when(clazz.getId()).thenReturn(2L);
        when(ay.getId()).thenReturn(3L);
        when(ay.getName()).thenReturn("2023-2024");

        AttendanceSession session = new AttendanceSession(ay, clazz, LocalDate.of(2024, 1, 2), SessionPart.PM);
        ReflectionTestUtils.setField(session, "id", 100L);

        when(attendanceSessionRepository.findById(100L)).thenReturn(Optional.of(session));

        AttendanceSessionResponse response = service.getById(100L);

        assertEquals(100L, response.getId());
        assertEquals(2L, response.getClassId());
        assertEquals(3L, response.getAcademicYearId());
        assertEquals("2023-2024", response.getAcademicYearName());
        assertEquals(SessionPart.PM, response.getSession());
    }

    @Test
    void listForClassBetween_requiresDates() {
        assertThrows(IllegalArgumentException.class,
                () -> service.listForClassBetween(1L, null, LocalDate.now()));
    }

    @Test
    void listForClassBetween_mapsResults() {
        Class clazz = mock(Class.class);
        AcademicYear ay = mock(AcademicYear.class);
        when(clazz.getId()).thenReturn(1L);
        when(ay.getId()).thenReturn(2L);
        when(ay.getName()).thenReturn("2024-2025");

        AttendanceSession s1 = new AttendanceSession(ay, clazz, LocalDate.of(2024, 9, 1), SessionPart.AM);
        AttendanceSession s2 = new AttendanceSession(ay, clazz, LocalDate.of(2024, 9, 2), SessionPart.PM);
        ReflectionTestUtils.setField(s1, "id", 11L);
        ReflectionTestUtils.setField(s2, "id", 12L);

        when(attendanceSessionRepository.findAllByClazz_IdAndSessionDateBetweenOrderBySessionDateAsc(
                1L, LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 2)))
                .thenReturn(List.of(s1, s2));

        List<AttendanceSessionResponse> result = service.listForClassBetween(
                1L, LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 2));

        assertEquals(2, result.size());
        assertEquals(11L, result.get(0).getId());
        assertEquals(12L, result.get(1).getId());
        assertEquals(SessionPart.AM, result.get(0).getSession());
        assertEquals(SessionPart.PM, result.get(1).getSession());
    }

    private CreateAttendanceSessionRequest buildRequest(Long classId, LocalDate date, SessionPart session) {
        CreateAttendanceSessionRequest req = new CreateAttendanceSessionRequest();
        ReflectionTestUtils.setField(req, "classId", classId);
        ReflectionTestUtils.setField(req, "sessionDate", date);
        ReflectionTestUtils.setField(req, "session", session);
        return req;
    }
}
