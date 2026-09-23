package com.billing.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS})
public class AuthController {

    @RequestMapping(value = "/login", method = {RequestMethod.POST, RequestMethod.OPTIONS})
    public ResponseEntity<?> login(@RequestBody(required = false) Map<String, String> loginRequest) {
        // If browser sends CORS preflight OPTIONS request, respond 200 OK immediately
        if (loginRequest == null || loginRequest.isEmpty()) {
            return ResponseEntity.ok().build();
        }

        String username = loginRequest.get("username");
        String password = loginRequest.get("password");

        // Credentials verification
        if (("admin".equalsIgnoreCase(username) && ("admin123".equals(password) || "omaew".equals(password))) ||
            ("staff".equalsIgnoreCase(username) && "omaew123".equals(password))) {
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", "session-token-" + System.currentTimeMillis());
            response.put("username", username);
            response.put("role", "admin".equalsIgnoreCase(username) ? "ADMIN" : "STAFF");
            return ResponseEntity.ok(response);
        }

        Map<String, String> error = new HashMap<>();
        error.put("message", "Invalid username or password.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }
}