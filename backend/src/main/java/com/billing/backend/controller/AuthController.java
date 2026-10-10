package com.billing.backend.controller;

import com.billing.backend.dto.LoginRequest;
import com.billing.backend.model.Role;
import com.billing.backend.model.User;
import com.billing.backend.repository.UserRepository;
import com.billing.backend.security.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthController(UserRepository userRepository, 
                           PasswordEncoder passwordEncoder, 
                           JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    // 1. REGISTER NEW USER
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");

        if (userRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
        }

        User user = new User();
        user.setUsername(username);
        // ENCRYPT PASSWORD BEFORE SAVING
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(Role.ROLE_VENDOR); // Default role

        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "User registered successfully!"));
    }

    // 2. LOGIN USER
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        Optional<User> userOptional = userRepository.findByUsername(loginRequest.getUsername());

        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
        }

        User user = userOptional.get();

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
        }

        // Generate JWT token for the authenticated user
        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole().name());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Login successful");
        response.put("token", token);
        response.put("username", user.getUsername());
        response.put("role", user.getRole());
        response.put("tenantId", user.getTenantId());

        return ResponseEntity.ok(response);
    }
}