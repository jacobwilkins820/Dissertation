package uk.ac.uclan.sis.sis_backend.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * 400 Exception for illegal arguments.
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class IllegalArgumentException extends RuntimeException {

    private final String entityName;

    public IllegalArgumentException(String entityName, String message) {
        super(entityName + ": " + message);
        this.entityName = entityName;
    }

    public String getEntityName() {
        return entityName;
    }
}