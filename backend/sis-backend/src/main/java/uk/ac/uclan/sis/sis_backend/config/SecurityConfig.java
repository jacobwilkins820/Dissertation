package uk.ac.uclan.sis.sis_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

import uk.ac.uclan.sis.sis_backend.auth.security.JwtAuthFilter;

@Configuration
public class SecurityConfig {

  private final JwtAuthFilter jwtAuthFilter;

  /**
   * Creates the security configuration with the JWT filter.
   *
   * @param jwtAuthFilter filter that authenticates bearer tokens
   */
  public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
    this.jwtAuthFilter = jwtAuthFilter;
  }

  /**
   * Builds the Spring Security filter chain for API requests.
   *
   * @param http security builder
   * @return configured filter chain
   * @throws Exception if security configuration fails
   */
  @Bean
  SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    return http
      .cors(cors -> {})
      .csrf(csrf -> csrf.disable())
      .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/auth/login", "/api/auth/logout", "/actuator/**").permitAll()
        .requestMatchers("/api/auth/me").authenticated()
        .anyRequest().authenticated()
      )
      .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
      .build();
  }

  /**
   * Defines CORS rules for the API.
   *
   * @return CORS configuration source
   */
  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();

    // Frontend dev server origin.
    config.setAllowedOrigins(List.of("http://localhost:5173"));

    // Allowed HTTP methods.
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

    // Allowed request headers.
    config.setAllowedHeaders(List.of("Authorization", "Content-Type"));

    // Expose auth header to clients.
    config.setExposedHeaders(List.of("Authorization"));

    // Credentials are not used for bearer token auth.
    config.setAllowCredentials(false);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }

}
