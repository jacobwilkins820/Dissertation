package uk.ac.uclan.sis.sis_backend.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception for forbidden resources.
 */
@ResponseStatus(HttpStatus.FORBIDDEN)
public class ForbiddenException extends RuntimeException {

    private final String entityName;

    public ForbiddenException(String entityName, String message) {
        super(entityName + ": " + message);
        this.entityName = entityName;
    }

    public String getEntityName() {
        return entityName;
    }
}