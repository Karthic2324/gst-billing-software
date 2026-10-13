package com.billing.backend.controller;

import com.billing.backend.model.User;
import com.billing.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public ResponseEntity<?> createVendorAccount(@RequestBody User vendor) {
        if (userRepository.findByUsername(vendor.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists!");
        }
        vendor.setPassword(passwordEncoder.encode(vendor.getPassword()));
        vendor.setRole("ROLE_VENDOR");
        vendor.setActive(true);
        User saved = userRepository.save(vendor);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/vendors/{id}")
    public ResponseEntity<?> updateVendorAccount(@PathVariable Long id, @RequestBody User details) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));

        existing.setBusinessName(details.getBusinessName());
        existing.setGstNumber(details.getGstNumber());
        existing.setPhone(details.getPhone());
        existing.setEmail(details.getEmail());
        if (details.getPassword() != null && !details.getPassword().trim().isEmpty()) {
            existing.setPassword(passwordEncoder.encode(details.getPassword()));
        }
        User updated = userRepository.save(existing);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/vendors/{id}/toggle-status")
    public ResponseEntity<?> toggleVendorStatus(@PathVariable Long id) {
        User vendor = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));
        vendor.setActive(!vendor.isActive());
        userRepository.save(vendor);
        return ResponseEntity.ok(vendor);
    }
}