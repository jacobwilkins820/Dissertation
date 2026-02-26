package uk.ac.uclan.sis.sis_backend.common.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Turns not found errors to a 404 response body.
     *
     * @param ex thrown exception
     * @return error response
     */
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<?> handleNotFound(NotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", 404,
                "error", "Not Found",
                "message", ex.getMessage()
        ));
    }

    /**
     * Turns forbidden errors to a 403 response body.
     *
     * @param ex thrown exception
     * @return error response
     */
    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<?> handleForbidden(ForbiddenException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", 403,
                "error", "Forbidden",
                "message", ex.getMessage()
        ));
    }

    /**
     * Turns authentication errors to a 401 response body.
     *
     * @param ex thrown exception
     * @return error response
     */
    @ExceptionHandler(AuthException.class)
    public ResponseEntity<?> handleAuthException(AuthException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", 401,
                "error", "Unauthorized",
                "message", ex.getMessage()
        ));
    }

    /**
     * Turns bad request errors to a 400 response body.
     *
     * @param ex thrown exception
     * @return error response
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", 400,
                "error", "Bad Request",
                "message", ex.getMessage()
        ));
    }

    /**
     * Turns data integrity violations to a 409 response body.
     *
     * @param ex thrown exception
     * @return error response
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> handleConflict(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", 409,
                "error", "Conflict",
                "message", "Request violates a database constraint"
        ));
    }

    /**
     * Turns SMTP authentication failures to a 502 response body.
     *
     * @param ex thrown exception
     * @return error response
     */
    @ExceptionHandler(MailAuthenticationException.class)
    public ResponseEntity<?> handleMailAuth(MailAuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", 502,
                "error", "Bad Gateway",
                "message", "Email authentication failed. Check SMTP username and app password."
        ));
    }

    /**
     * Turns mail send failures to a 502 response body.
     *
     * @param ex thrown exception
     * @return error response
     */
    @ExceptionHandler(MailException.class)
    public ResponseEntity<?> handleMailFailure(MailException ex) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", 502,
                "error", "Bad Gateway",
                "message", "Email provider rejected the send request."
        ));
    }

}
