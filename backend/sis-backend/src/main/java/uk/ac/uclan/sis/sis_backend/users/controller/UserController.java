package uk.ac.uclan.sis.sis_backend.users.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import uk.ac.uclan.sis.sis_backend.users.dto.*;
import uk.ac.uclan.sis.sis_backend.users.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    /**
     * Creates the user controller.
     *
     * @param userService service for user operations
     */
    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Returns all users.
     *
     * @return list of users
     */
    @GetMapping
    public List<UserListItemResponse> list() {
        return userService.list();
    }

    /**
     * Returns a user by id.
     *
     * @param id user id
     * @return user details
     */
    @GetMapping("/{id}")
    public UserDetailResponse get(@PathVariable Long id) {
        return userService.get(id);
    }

    /**
     * Creates a user.
     *
     * @param req create request payload
     * @return created user list item
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserListItemResponse create(@Valid @RequestBody CreateUserRequest req) {
        return userService.create(req);
    }

    /**
     * Creates a guardian and linked parent user in one action.
     *
     * @param req create request payload
     * @return created user list item
     */
    @PostMapping("/guardian-account")
    @ResponseStatus(HttpStatus.CREATED)
    public UserListItemResponse createGuardianAccount(@Valid @RequestBody CreateGuardianUserRequest req) {
        return userService.createGuardianUser(req);
    }

    /**
     * Updates a user.
     *
     * @param id user id
     * @param req update request payload
     * @return updated user list item
     */
    @PutMapping("/{id}")
    public UserListItemResponse update(@PathVariable Long id,
                                     @Valid @RequestBody UpdateUserRequest req) {
        return userService.update(id, req);
    }

    /**
     * Updates the current authenticated user's profile details.
     *
     * @param req update request payload
     * @return updated user list item
     */
    @PutMapping("/me")
    public UserListItemResponse updateCurrent(@Valid @RequestBody UpdateCurrentUserRequest req) {
        return userService.updateCurrent(req);
    }

    /**
     * Deletes a user.
     *
     * @param id user id
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        userService.delete(id);
    }
}
