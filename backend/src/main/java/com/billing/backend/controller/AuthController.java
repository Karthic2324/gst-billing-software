package com.billing.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AuthController {

    @RequestMapping(value = {"/api/auth/login", "/api/login"}, method = {RequestMethod.POST, RequestMethod.OPTIONS})
    public ResponseEntity<?> login(@RequestBody(required = false) Map<String, String> loginRequest) {
        if (loginRequest == null) {
            return ResponseEntity.ok().build(); // Return 200 OK for OPTIONS pre-flight checks
        }

        String username = loginRequest.get("username");
        String password = loginRequest.get("password");

        boolean isAdmin = "admin".equalsIgnoreCase(username) && 
            ("admin123".equals(password) || "omaew".equals(password));
        boolean isStaff = "staff".equalsIgnoreCase(username) && "omaew123".equals(password);

        if (isAdmin || isStaff) {
            Map<String, Object> response = new HashMap<>();
            response.put("token", "session-token-" + System.currentTimeMillis());
            response.put("username", username);
            response.put("role", isAdmin ? "ADMIN" : "STAFF");
            return ResponseEntity.ok(response);
        }

        Map<String, String> error = new HashMap<>();
        error.put("message", "Invalid username or password.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }
}