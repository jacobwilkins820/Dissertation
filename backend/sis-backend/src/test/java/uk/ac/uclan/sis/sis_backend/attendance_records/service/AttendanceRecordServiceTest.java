package uk.ac.uclan.sis.sis_backend.attendance_records.service;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.util.ReflectionTestUtils;
import uk.ac.uclan.sis.sis_backend.attendance_records.AttendanceStatus;
import uk.ac.uclan.sis.sis_backend.attendance_records.dto.AttendanceRecordListItemResponse;
import uk.ac.uclan.sis.sis_backend.attendance_records.dto.AttendanceRecordResponse;
import uk.ac.uclan.sis.sis_backend.attendance_records.dto.CreateAttendanceRecordRequest;
import uk.ac.uclan.sis.sis_backend.attendance_records.dto.UpdateAttendanceRecordRequest;
import uk.ac.uclan.sis.sis_backend.attendance_records.entity.AttendanceRecord;
import uk.ac.uclan.sis.sis_backend.attendance_records.repository.AttendanceRecordRepository;
import uk.ac.uclan.sis.sis_backend.attendance_sessions.entity.AttendanceSession;
import uk.ac.uclan.sis.sis_backend.common.exception.NotFoundException;
import uk.ac.uclan.sis.sis_backend.students.entity.Student;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AttendanceRecordServiceTest {

    @Mock
    private AttendanceRecordRepository repository;

    @Mock
    private EntityManager em;

    @InjectMocks
    private AttendanceRecordService service;

    @Test
    void getById_returnsResponse() {
        AttendanceSession session = mock(AttendanceSession.class);
        Student student = mock(Student.class);
        when(session.getId()).thenReturn(2L);
        when(student.getId()).thenReturn(3L);

        AttendanceRecord record = buildRecord(10L, session, student, AttendanceStatus.PRESENT, "ok");

        when(repository.findById(10L)).thenReturn(Optional.of(record));

        AttendanceRecordResponse response = service.getById(10L);

        assertEquals(10L, response.getId());
        assertEquals(2L, response.getAttendanceSessionId());
        assertEquals(3L, response.getStudentId());
        assertEquals(AttendanceStatus.PRESENT, response.getStatus());
        assertEquals("ok", response.getReason());
        assertNotNull(response.getMarkedAt());
    }

    @Test
    void getById_missingThrows() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> service.getById(99L));
    }

    @Test
    void listBySession_mapsResults() {
        AttendanceSession session = mock(AttendanceSession.class);
        Student student = mock(Student.class);
        when(student.getId()).thenReturn(5L);

        AttendanceRecord record = buildRecord(7L, session, student, AttendanceStatus.ABSENT, "sick");

        when(repository.findByAttendanceSession_IdOrderByIdAsc(1L)).thenReturn(List.of(record));

        List<AttendanceRecordListItemResponse> result = service.listBySession(1L);

        assertEquals(1, result.size());
        AttendanceRecordListItemResponse item = result.get(0);
        assertEquals(7L, item.getId());
        assertEquals(5L, item.getStudentId());
        assertEquals(AttendanceStatus.ABSENT, item.getStatus());
        assertNotNull(item.getMarkedAt());
    }

    @Test
    void create_duplicateThrows() {
        CreateAttendanceRecordRequest req = new CreateAttendanceRecordRequest();
        req.setAttendanceSessionId(1L);
        req.setStudentId(2L);
        req.setStatus(AttendanceStatus.PRESENT);

        when(repository.existsByAttendanceSession_IdAndStudent_Id(1L, 2L)).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> service.create(req));
        verify(repository, never()).save(any(AttendanceRecord.class));
    }

    @Test
    void create_successReturnsResponse() {
        CreateAttendanceRecordRequest req = new CreateAttendanceRecordRequest();
        req.setAttendanceSessionId(1L);
        req.setStudentId(2L);
        req.setStatus(AttendanceStatus.LATE);
        req.setReason("bus");

        AttendanceSession session = mock(AttendanceSession.class);
        Student student = mock(Student.class);
        when(session.getId()).thenReturn(1L);
        when(student.getId()).thenReturn(2L);

        when(repository.existsByAttendanceSession_IdAndStudent_Id(1L, 2L)).thenReturn(false);
        when(em.getReference(AttendanceSession.class, 1L)).thenReturn(session);
        when(em.getReference(Student.class, 2L)).thenReturn(student);

        when(repository.save(any(AttendanceRecord.class))).thenAnswer(invocation -> {
            AttendanceRecord saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 99L);
            ReflectionTestUtils.setField(saved, "createdAt", LocalDateTime.now());
            ReflectionTestUtils.setField(saved, "updatedAt", LocalDateTime.now());
            return saved;
        });

        AttendanceRecordResponse response = service.create(req);

        assertEquals(99L, response.getId());
        assertEquals(1L, response.getAttendanceSessionId());
        assertEquals(2L, response.getStudentId());
        assertEquals(AttendanceStatus.LATE, response.getStatus());
        assertEquals("bus", response.getReason());
        assertNotNull(response.getMarkedAt());
    }

    @Test
    void create_invalidFkThrows() {
        CreateAttendanceRecordRequest req = new CreateAttendanceRecordRequest();
        req.setAttendanceSessionId(1L);
        req.setStudentId(2L);
        req.setStatus(AttendanceStatus.PRESENT);

        when(repository.existsByAttendanceSession_IdAndStudent_Id(1L, 2L)).thenReturn(false);
        when(em.getReference(AttendanceSession.class, 1L)).thenReturn(mock(AttendanceSession.class));
        when(em.getReference(Student.class, 2L)).thenReturn(mock(Student.class));
        when(repository.save(any(AttendanceRecord.class))).thenThrow(new DataIntegrityViolationException("fk"));

        assertThrows(IllegalArgumentException.class, () -> service.create(req));
    }

    @Test
    void update_updatesFields() {
        AttendanceSession session = mock(AttendanceSession.class);
        Student student = mock(Student.class);

        AttendanceRecord record = buildRecord(8L, session, student, AttendanceStatus.PRESENT, "ok");
        LocalDateTime before = record.getMarkedAt();

        UpdateAttendanceRecordRequest req = new UpdateAttendanceRecordRequest();
        req.setStatus(AttendanceStatus.ABSENT);
        req.setReason("ill");

        when(repository.findById(8L)).thenReturn(Optional.of(record));
        when(repository.save(record)).thenReturn(record);

        AttendanceRecordResponse response = service.update(8L, req);

        assertEquals(AttendanceStatus.ABSENT, response.getStatus());
        assertEquals("ill", response.getReason());
        assertNotNull(response.getMarkedAt());
        assertNotEquals(before, response.getMarkedAt());
    }

    @Test
    void update_missingThrows() {
        UpdateAttendanceRecordRequest req = new UpdateAttendanceRecordRequest();
        req.setStatus(AttendanceStatus.ABSENT);

        when(repository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.update(404L, req));
    }

    @Test
    void delete_existingDeletes() {
        when(repository.existsById(3L)).thenReturn(true);

        service.delete(3L);

        verify(repository).deleteById(3L);
    }

    @Test
    void delete_missingThrows() {
        when(repository.existsById(3L)).thenReturn(false);

        assertThrows(NotFoundException.class, () -> service.delete(3L));
        verify(repository, never()).deleteById(anyLong());
    }

    private AttendanceRecord buildRecord(
            Long id,
            AttendanceSession session,
            Student student,
            AttendanceStatus status,
            String reason
    ) {
        AttendanceRecord record = new AttendanceRecord();
        record.setAttendanceSession(session);
        record.setStudent(student);
        record.setStatus(status);
        record.setReason(reason);
        record.setMarkedAt(LocalDateTime.now().minusHours(1));
        ReflectionTestUtils.setField(record, "id", id);
        ReflectionTestUtils.setField(record, "createdAt", LocalDateTime.now().minusDays(1));
        ReflectionTestUtils.setField(record, "updatedAt", LocalDateTime.now().minusDays(1));
        return record;
    }
}
