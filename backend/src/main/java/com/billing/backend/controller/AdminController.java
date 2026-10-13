package com.billing.backend.controller;

import com.billing.backend.model.User;
import com.billing.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/vendors")
    public ResponseEntity<List<User>> getAllVendors() {
        return ResponseEntity.ok(userRepository.findByRole("ROLE_VENDOR"));
    }

    @PostMapping("/vendors/create")
    public ResponseEntity<?> createVendor(@RequestBody User vendorRequest) {
        try {
            if (vendorRequest.getUsername() == null || vendorRequest.getPassword() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Username and password are required"));
            }

            if (userRepository.findByUsernameIgnoreCase(vendorRequest.getUsername().trim()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Vendor username already exists"));
            }

            User newVendor = new User();
            newVendor.setUsername(vendorRequest.getUsername().trim());
            // Encode raw password directly
            newVendor.setPassword(passwordEncoder.encode(vendorRequest.getPassword().trim()));
            newVendor.setRole("ROLE_VENDOR");
            newVendor.setActive(true);
            newVendor.setBusinessName(vendorRequest.getBusinessName() != null ? vendorRequest.getBusinessName().trim() : vendorRequest.getUsername());
            newVendor.setGstNumber(vendorRequest.getGstNumber() != null ? vendorRequest.getGstNumber().trim() : "N/A");
            newVendor.setPhone(vendorRequest.getPhone() != null ? vendorRequest.getPhone().trim() : "");
            newVendor.setEmail(vendorRequest.getEmail() != null ? vendorRequest.getEmail().trim() : "");

            User saved = userRepository.save(newVendor);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error creating vendor: " + e.getMessage()));
        }
    }

    @PatchMapping("/vendors/{id}/toggle-status")
    public ResponseEntity<?> toggleVendorStatus(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            user.setActive(!user.isActive());
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Status updated successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }
}