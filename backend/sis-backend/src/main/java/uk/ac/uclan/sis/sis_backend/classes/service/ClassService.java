package uk.ac.uclan.sis.sis_backend.classes.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import uk.ac.uclan.sis.sis_backend.auth.security.AuthorizationService;
import uk.ac.uclan.sis.sis_backend.classes.dto.ClassListItemResponse;
import uk.ac.uclan.sis.sis_backend.classes.dto.ClassResponse;
import uk.ac.uclan.sis.sis_backend.classes.dto.CreateClassRequest;
import uk.ac.uclan.sis.sis_backend.classes.dto.UpdateClassRequest;
import uk.ac.uclan.sis.sis_backend.classes.entity.Class;
import uk.ac.uclan.sis.sis_backend.classes.repository.ClassRepository;
import uk.ac.uclan.sis.sis_backend.common.exception.NotFoundException;
import uk.ac.uclan.sis.sis_backend.roles.Permissions;
import uk.ac.uclan.sis.sis_backend.users.entity.User;
import uk.ac.uclan.sis.sis_backend.users.repository.UserRepository;

import java.util.List;

@Service
public class ClassService {

    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final AuthorizationService authorizationService;

    public ClassService(
            ClassRepository classRepository,
            UserRepository userRepository,
            AuthorizationService authorizationService
    ) {
        this.classRepository = classRepository;
        this.userRepository = userRepository;
        this.authorizationService = authorizationService;
    }

    @Transactional
    public ClassResponse create(CreateClassRequest request) {
        authorizationService.requireAdmin(currentUser());
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Class name is required");
        }

        Class classEntity = new Class();
        classEntity.setName(request.getName().trim());
        classEntity.setCode(normaliseOptionalCode(request.getCode()));
        classEntity.setActive(request.getActive() == null ? true : request.getActive());

        // dev note: teacher is optional - only link if provided.
        if (request.getTeacherId() != null) {
            classEntity.setTeacher(getTeacherOrThrow(request.getTeacherId()));
        }
        
        Class saved = classRepository.save(classEntity);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ClassListItemResponse> listAll() {
        authorizationService.require(currentUser(), Permissions.VIEW_CLASSES);
        return classRepository.findAll()
                .stream()
                .map(c -> new ClassListItemResponse(c.getId(), c.getName(), c.getCode(), c.isActive()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ClassResponse getById(Long id) {
        authorizationService.require(currentUser(), Permissions.VIEW_CLASSES);
        Class classEntity = classRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Class", "Class not found with id: " + id));
        return toResponse(classEntity);
    }

    @Transactional
    public ClassResponse update(Long id, UpdateClassRequest request) {
        authorizationService.requireAdmin(currentUser());
        Class classEntity = classRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Class", "Class not found with id: " + id));

        // dev note: update only fields that are provided
        if (request.getName() != null) {
            String name = request.getName().trim();
            if (name.isEmpty()) throw new IllegalArgumentException("Class name cannot be empty");
            classEntity.setName(name);
        }

        if (request.getCode() != null) {
            classEntity.setCode(normaliseOptionalCode(request.getCode()));
        }

        if (request.getActive() != null) {
            classEntity.setActive(request.getActive());
            // dev note: no hidden behaviour here; teacher unassignment is explicit via /teacher/unassign endpoint.
        }

        // dev note: only assign teacher when a non-null teacherId is provided in update.
        // Unassignment is handled via unassignTeacher(id) to avoid JSON null ambiguity.
        if (request.getTeacherId() != null) {
            classEntity.setTeacher(getTeacherOrThrow(request.getTeacherId()));
        }

        Class saved = classRepository.save(classEntity);
        return toResponse(saved);
    }

    @Transactional
    public void unassignTeacher(Long id) {
        authorizationService.requireAdmin(currentUser());
        Class classEntity = classRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Class", "Class not found with id: " + id));

        classEntity.setTeacher(null);
        classRepository.save(classEntity);
    }

    @Transactional
    public void delete(Long id) {
        authorizationService.requireAdmin(currentUser());
        if (!classRepository.existsById(id)) {
            throw new NotFoundException("Class", "Class not found with id: " + id);
        }
        classRepository.deleteById(id);
    }

    private User getTeacherOrThrow(Long teacherId) {
        return userRepository.findById(teacherId)
                .orElseThrow(() -> new NotFoundException("User", "Teacher user not found with id: " + teacherId));
    }

    private String normaliseOptionalCode(String code) {
        if (code == null) return null;
        String c = code.trim();
        return c.isEmpty() ? null : c;
    }

    private ClassResponse toResponse(Class classEntity) {
        Long teacherId = null;
        String teacherName = null;

        // dev note: teacher is LAZY; safe to access here because we're inside @Transactional methods.
        if (classEntity.getTeacher() != null) {
            teacherId = classEntity.getTeacher().getId();

            // dev note: adjust if your User uses different field names.
            String first = classEntity.getTeacher().getFirstName();
            String last = classEntity.getTeacher().getLastName();
            String full = ((first == null ? "" : first) + " " + (last == null ? "" : last)).trim();
            teacherName = full.isEmpty() ? null : full;
        }

        return new ClassResponse(
                classEntity.getId(),
                teacherId,
                teacherName,
                classEntity.getName(),
                classEntity.getCode(),
                classEntity.isActive()
        );
    }

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return (User) auth.getPrincipal();
    }
}
