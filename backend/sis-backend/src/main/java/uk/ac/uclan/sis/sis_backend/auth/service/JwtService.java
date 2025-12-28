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

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.issuer:}") String issuer,
            @Value("${jwt.ttl-minutes:60}") long ttlMinutes
    ) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("jwt.secret must be set");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.issuer = issuer == null ? "" : issuer.trim();
        this.tokenTtl = Duration.ofMinutes(ttlMinutes);
    }

    public Optional<Long> extractUserId(String token) {
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

    public Claims parse(String token) throws JwtException {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        if (!issuer.isBlank() && !issuer.equals(claims.getIssuer())) {
            throw new JwtException("Invalid token issuer");
        }

        return claims;
    }

    public String generateToken(User user) {
        Instant now = Instant.now();
        Instant exp = now.plus(tokenTtl);

        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .issuer(issuer.isBlank() ? null : issuer)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(key)
                .compact();
    }
}
