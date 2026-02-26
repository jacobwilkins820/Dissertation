package uk.ac.uclan.sis.sis_backend.users.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uk.ac.uclan.sis.sis_backend.users.entity.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Gets true when an email already exists (case-insensitive).
     *
     * @param email email address
     * @return true when email exists
     */
    boolean existsByEmailIgnoreCase(String email);

    /**
     * Finds a user by email (case-insensitive).
     *
     * @param email email address
     * @return matching user, when present
     */
    Optional<User> findByEmailIgnoreCase(String email);

    /**
     * Gets all users with roles eagerly loaded.
     *
     * @return list of users with roles
     */
    @Query("select u from User u join fetch u.role")
    List<User> findAllWithRole();

    /**
     * Gets a user by id with the role eagerly loaded.
     *
     * @param id user id
     * @return matching user, when present
     */
    @Query("select u from User u join fetch u.role where u.id = :id")
    Optional<User> findByIdWithRole(@Param("id") Long id);
}
