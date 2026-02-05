package uk.ac.uclan.sis.sis_backend.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Generic 404 exception for missing resources.
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class NotFoundException extends RuntimeException {

    private final String entityName;

    /**
     * Creates a not found exception with entity context.
     *
     * @param entityName entity associated with the error
     * @param message error detail
     */
    public NotFoundException(String entityName, String message) {
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
