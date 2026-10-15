package com.billing.backend.controller;

import com.billing.backend.model.User;
import com.billing.backend.repository.UserRepository;
import com.billing.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String input = request.get("email");
        if (input == null || input.trim().isEmpty()) {
            input = request.get("username");
        }
        String password = request.get("password");

        if (input == null || password == null) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Username/Email and Password are required");
            return ResponseEntity.badRequest().body(err);
        }

        // Try searching by email first, then username
        Optional<User> userOpt = userRepository.findByEmail(input.trim());
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByUsername(input.trim());
        }
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByUsernameIgnoreCase(input.trim());
        }

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (passwordEncoder.matches(password, user.getPassword())) {
                String token = jwtUtil.generateToken(
                    user.getEmail() != null ? user.getEmail() : user.getUsername(),
                    user.getRole() != null ? user.getRole() : "ROLE_VENDOR"
                );

                Map<String, Object> response = new HashMap<>();
                response.put("token", token);
                response.put("id", user.getId());
                response.put("username", user.getUsername());
                response.put("email", user.getEmail());
                response.put("role", user.getRole());
                response.put("businessName", user.getBusinessName() != null ? user.getBusinessName() : "Om Muruga Auto Electrical Works");
                response.put("gstNumber", user.getGstNumber() != null ? user.getGstNumber() : "33DSSPS7678B1Z2");

                return ResponseEntity.ok(response);
            }
        }

        Map<String, String> err = new HashMap<>();
        err.put("error", "Invalid username/email or password");
        return ResponseEntity.status(401).body(err);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (user.getEmail() != null && !user.getEmail().isEmpty() && userRepository.findByEmail(user.getEmail()).isPresent()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Email already in use");
            return ResponseEntity.badRequest().body(err);
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("ROLE_VENDOR");
        }

        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(savedUser);
    }
}