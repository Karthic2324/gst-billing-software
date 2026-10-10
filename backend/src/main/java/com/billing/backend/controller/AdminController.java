package com.billing.backend.controller;

import com.billing.backend.model.Role;
import com.billing.backend.model.User;
import com.billing.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/create-vendor")
    public ResponseEntity<?> createVendor(@RequestBody User vendor) {
        try {
            if (vendor.getUsername() == null || vendor.getPassword() == null) {
                return ResponseEntity.badRequest().body("Username and password are required.");
            }

            if (userRepository.findByUsername(vendor.getUsername()).isPresent()) {
                return ResponseEntity.badRequest().body("Error: Username '" + vendor.getUsername() + "' already exists!");
            }

            vendor.setPassword(passwordEncoder.encode(vendor.getPassword()));
            vendor.setRole(Role.VENDOR);

            userRepository.save(vendor);
            return ResponseEntity.ok("Vendor created successfully!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Database error: " + e.getMessage());
        }
    }
}