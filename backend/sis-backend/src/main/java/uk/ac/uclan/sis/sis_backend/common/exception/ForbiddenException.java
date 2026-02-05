package uk.ac.uclan.sis.sis_backend.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * 403 Exception for forbidden resources.
 */
@ResponseStatus(HttpStatus.FORBIDDEN)
public class ForbiddenException extends RuntimeException {

    private final String entityName;

    /**
     * Creates a forbidden exception with entity context.
     *
     * @param entityName entity associated with the error
     * @param message error detail
     */
    public ForbiddenException(String entityName, String message) {
        super(entityName + ": " + message);
        this.entityName = entityName;
    }

    /**
     * Returns the related entity name.
     *
     * @return entity name
     */
    public String getEntityName() {
        return entityName;
    }
}
