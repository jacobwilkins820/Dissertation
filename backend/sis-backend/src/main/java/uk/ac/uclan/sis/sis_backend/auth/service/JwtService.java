package uk.ac.uclan.sis.sis_backend.auth.service;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import uk.ac.uclan.sis.sis_backend.users.entity.User;

@Service
public class JwtService {

    private final SecretKey key;
    private final String issuer;
    private final Duration tokenTtl;

    /**
     * Sets up the JWT service from configuration.
     *
     * @param secret signing key material
     * @param issuer expected issuer value
     * @param ttlMinutes token lifetime in minutes
     */
    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.issuer:}") String issuer,
            @Value("${jwt.ttl-minutes:60}") long ttlMinutes
    ) {
        // Fail fast when the secret is missing.
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("jwt.secret must be set");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.issuer = issuer == null ? "" : issuer.trim();
        this.tokenTtl = Duration.ofMinutes(ttlMinutes);
    }

    /**
     * Extracts the user id from a token subject.
     *
     * @param token JWT string
     * @return optional user id
     */
    public Optional<Long> extractUserId(String token) {
        // Parse claims before reading the subject.
        Claims claims = parse(token);
        String subject = claims.getSubject();
        if (subject == null || subject.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(Long.parseLong(subject));
        } catch (NumberFormatException ex) {
            return Optional.empty();
        }
    }

    /**
     * Parses a token and validates its signature and issuer.
     *
     * @param token JWT string
     * @return parsed claims
     * @throws JwtException when validation fails
     */
    public Claims parse(String token) throws JwtException {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        // Enforce issuer when configured.
        if (!issuer.isBlank() && !issuer.equals(claims.getIssuer())) {
            throw new JwtException("Invalid token issuer");
        }

        return claims;
    }

    /**
     * Generates a signed JWT for the user.
     *
     * @param user logged-in user
     * @return signed token string
     */
    public String generateToken(User user) {
        Instant now = Instant.now();
        Instant exp = now.plus(tokenTtl);

        // Build a token with subject and expiry.
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .issuer(issuer.isBlank() ? null : issuer)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(key)
                .compact();
    }
}
