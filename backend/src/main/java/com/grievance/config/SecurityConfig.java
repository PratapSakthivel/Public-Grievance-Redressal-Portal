package com.grievance.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    
    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/complaints/public").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/complaints/similar").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/complaints/search").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/complaints/{id}").permitAll()
                .requestMatchers("/ws/**").permitAll()
                
                // Citizen endpoints
                .requestMatchers("/api/complaints/my/**").hasAnyAuthority("CITIZEN", "SUPER_ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/complaints").hasAnyAuthority("CITIZEN", "SUPER_ADMIN")
                .requestMatchers("/api/complaints/*/upvote").hasAnyAuthority("CITIZEN", "SUPER_ADMIN")
                
                // Officer endpoints
                .requestMatchers("/api/complaints/assigned/**").hasAnyAuthority("OFFICER", "SUPER_ADMIN")
                .requestMatchers("/api/complaints/*/status").hasAnyAuthority("OFFICER", "DEPT_HEAD", "SUPER_ADMIN")
                
                // Department Head endpoints
                .requestMatchers("/api/complaints/department/**").hasAnyAuthority("DEPT_HEAD", "SUPER_ADMIN")
                .requestMatchers("/api/complaints/*/assign").hasAnyAuthority("DEPT_HEAD", "SUPER_ADMIN")
                .requestMatchers("/api/analytics/department/**").hasAnyAuthority("DEPT_HEAD", "SUPER_ADMIN")
                
                // Super Admin endpoints
                .requestMatchers("/api/admin/**").hasAuthority("SUPER_ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/departments").hasAnyAuthority("CITIZEN", "OFFICER", "DEPT_HEAD", "SUPER_ADMIN")
                .requestMatchers("/api/departments/**").hasAuthority("SUPER_ADMIN")
                .requestMatchers("/api/users/**").hasAuthority("SUPER_ADMIN")
                .requestMatchers("/api/analytics/global").hasAuthority("SUPER_ADMIN")
                
                // Any other request needs auth
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:4200", "https://your-frontend.vercel.app"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
    
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }
    
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
