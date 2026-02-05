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

    /**
     * Creates the class service.
     *
     * @param classRepository repository for class access
     * @param userRepository repository for user access
     * @param authorizationService service for permission checks
     */
    public ClassService(
            ClassRepository classRepository,
            UserRepository userRepository,
            AuthorizationService authorizationService
    ) {
        this.classRepository = classRepository;
        this.userRepository = userRepository;
        this.authorizationService = authorizationService;
    }

    /**
     * Creates a class.
     *
     * @param request create request payload
     * @return created class response
     */
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

        // Teacher is optional; only link when provided.
        if (request.getTeacherId() != null) {
            classEntity.setTeacher(getTeacherOrThrow(request.getTeacherId()));
        }
        
        Class saved = classRepository.save(classEntity);
        return toResponse(saved);
    }

    /**
     * Returns all classes as list items.
     *
     * @return list of classes
     */
    @Transactional(readOnly = true)
    public List<ClassListItemResponse> listAll() {
        authorizationService.require(currentUser(), Permissions.VIEW_CLASSES);
        return classRepository.findAll()
                .stream()
                .map(c -> new ClassListItemResponse(c.getId(), c.getName(), c.getCode(), c.isActive()))
                .toList();
    }

    /**
     * Returns a class by id.
     *
     * @param id class id
     * @return class response
     */
    @Transactional(readOnly = true)
    public ClassResponse getById(Long id) {
        authorizationService.require(currentUser(), Permissions.VIEW_CLASSES);
        Class classEntity = classRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Class", "Class not found with id: " + id));
        return toResponse(classEntity);
    }

    /**
     * Updates a class by id.
     *
     * @param id class id
     * @param request update request payload
     * @return updated class response
     */
    @Transactional
    public ClassResponse update(Long id, UpdateClassRequest request) {
        authorizationService.requireAdmin(currentUser());
        Class classEntity = classRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Class", "Class not found with id: " + id));

        // Update only fields that are provided.
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
            // Teacher unassignment is explicit via the unassign endpoint.
        }

        // Only assign teacher when a non-null id is provided in update.
        // Unassignment is handled via unassignTeacher(id) to avoid JSON null ambiguity.
        if (request.getTeacherId() != null) {
            classEntity.setTeacher(getTeacherOrThrow(request.getTeacherId()));
        }

        Class saved = classRepository.save(classEntity);
        return toResponse(saved);
    }

    /**
     * Unassigns the teacher from a class.
     *
     * @param id class id
     */
    @Transactional
    public void unassignTeacher(Long id) {
        authorizationService.requireAdmin(currentUser());
        Class classEntity = classRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Class", "Class not found with id: " + id));

        classEntity.setTeacher(null);
        classRepository.save(classEntity);
    }

    /**
     * Deletes a class by id.
     *
     * @param id class id
     */
    @Transactional
    public void delete(Long id) {
        authorizationService.requireAdmin(currentUser());
        if (!classRepository.existsById(id)) {
            throw new NotFoundException("Class", "Class not found with id: " + id);
        }
        classRepository.deleteById(id);
    }

    /**
     * Returns a teacher user by id or throws.
     *
     * @param teacherId teacher user id
     * @return teacher user
     */
    private User getTeacherOrThrow(Long teacherId) {
        return userRepository.findById(teacherId)
                .orElseThrow(() -> new NotFoundException("User", "Teacher user not found with id: " + teacherId));
    }

    /**
     * Normalizes an optional class code value.
     *
     * @param code class code
     * @return normalized code or null
     */
    private String normaliseOptionalCode(String code) {
        if (code == null) return null;
        String c = code.trim();
        return c.isEmpty() ? null : c;
    }

    /**
     * Maps a class entity to a response.
     *
     * @param classEntity class entity
     * @return class response
     */
    private ClassResponse toResponse(Class classEntity) {
        Long teacherId = null;
        String teacherName = null;

        // Teacher is lazy-loaded and accessed within a transaction.
        if (classEntity.getTeacher() != null) {
            teacherId = classEntity.getTeacher().getId();

            // Adjust if User uses different field names.
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

    /**
     * Returns the current authenticated user.
     *
     * @return current user principal
     */
    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return (User) auth.getPrincipal();
    }
}
