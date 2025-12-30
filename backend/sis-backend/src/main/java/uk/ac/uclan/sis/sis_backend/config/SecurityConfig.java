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

  public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
    this.jwtAuthFilter = jwtAuthFilter;
  }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
      return http
        .cors(cors -> {})
        .csrf(csrf -> csrf.disable())
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
          .requestMatchers("/api/auth/login", "/actuator/**").permitAll()
          .requestMatchers("/api/auth/me").authenticated()
          .anyRequest().authenticated()
        )
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
        .build();
    }


    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // frontend dev server
        config.setAllowedOrigins(List.of("http://localhost:5173"));

        // Methods the frontend will use
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // Headers the browser may send
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));

        config.setExposedHeaders(List.of("Authorization"));

        // For Bearer token, keep false.
        config.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
  }

}
