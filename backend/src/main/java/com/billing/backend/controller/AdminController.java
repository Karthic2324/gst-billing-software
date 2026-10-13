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
    public ResponseEntity<?> createVendor(@RequestBody User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username already exists"));
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole("ROLE_VENDOR");
        user.setActive(true);
        User saved = userRepository.save(user);
        return ResponseEntity.ok(saved);
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