package uk.ac.uclan.sis.sis_backend.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * 401 Exception for authentication exceptions.
 */
@ResponseStatus(HttpStatus.UNAUTHORIZED)
public class AuthException extends RuntimeException {

    private final String entityName;

    /**
     * Creates an authentication exception with entity context.
     *
     * @param entityName entity associated with the error
     * @param message error detail
     */
    public AuthException(String entityName, String message) {
        super(entityName + ": " + message);
        this.entityName = entityName;
    }

    /**
     * Gets the related entity name.
     *
     * @return entity name
     */
    public String getEntityName() {
        return entityName;
    }
}
