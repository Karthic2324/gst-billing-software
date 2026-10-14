package com.billing.backend.controller;

import com.billing.backend.model.User;
import com.billing.backend.repository.UserRepository;
import com.billing.backend.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

//import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");

        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username and password are required."));
        }

        // Case-insensitive user lookup
        Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(username.trim());

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid username or password."));
        }

        User user = userOpt.get();

        // Check hashed password using PasswordEncoder matches
        if (!passwordEncoder.matches(password.trim(), user.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid username or password."));
        }

        // Generate token with explicitly formatted role
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

        return ResponseEntity.ok(Map.of(
            "token", token,
            "role", user.getRole(),
            "userId", user.getId(),
            "businessName", user.getBusinessName() != null ? user.getBusinessName() : user.getUsername(),
            "gstNumber", user.getGstNumber() != null ? user.getGstNumber() : "N/A"
        ));
    }
    @PostMapping("/reset-vendor")
    public ResponseEntity<?> resetVendorAccount(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String rawPassword = request.get("password");

        Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(username);
        User user = userOpt.orElseGet(User::new);

        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole("ROLE_VENDOR");
        user.setActive(true);
        user.setBusinessName("Om Muruga Auto Electrical Works");
        user.setGstNumber("33DSSPS7678B1Z2");

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Vendor account created/updated with encoded password successfully!"));
    }
}