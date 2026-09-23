package com.billing.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");

        // Hardcoded credentials for testing/staff login
        if (("admin".equalsIgnoreCase(username) && "omaew".equals(password)) ||
            ("staff".equalsIgnoreCase(username) && "omaew123".equals(password))) {
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", "session-token-" + System.currentTimeMillis());
            response.put("username", username);
            response.put("role", "admin".equalsIgnoreCase(username) ? "ADMIN" : "STAFF");
            return ResponseEntity.ok(response);
        }

        Map<String, String> error = new HashMap<>();
        error.put("message", "Invalid username or password.");
        return ResponseEntity.status(401).body(error);
    }
}