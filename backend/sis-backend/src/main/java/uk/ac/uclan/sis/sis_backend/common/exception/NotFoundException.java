package uk.ac.uclan.sis.sis_backend.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Generic 404 exception for missing resources.
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class NotFoundException extends RuntimeException {

    private final String entityName;

    public NotFoundException(String entityName, String message) {
        super(entityName + ": " + message);
        this.entityName = entityName;
    }

    public String getEntityName() {
        return entityName;
    }
}