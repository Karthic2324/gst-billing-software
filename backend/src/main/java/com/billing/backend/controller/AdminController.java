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
    public ResponseEntity<?> createVendor(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            String password = request.get("password");
            String businessName = request.get("businessName");
            String gstNumber = request.get("gstNumber");
            String phone = request.get("phone");
            String email = request.get("email");

            if (username == null || username.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Username is required"));
            }
            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Password is required"));
            }

            if (userRepository.findByUsernameIgnoreCase(username.trim()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Vendor username already exists!"));
            }

            User newVendor = new User();
            newVendor.setUsername(username.trim());
            newVendor.setPassword(passwordEncoder.encode(password.trim()));
            newVendor.setRole("ROLE_VENDOR");
            newVendor.setActive(true);
            newVendor.setBusinessName(businessName != null && !businessName.trim().isEmpty() ? businessName.trim() : username.trim());
            newVendor.setGstNumber(gstNumber != null && !gstNumber.trim().isEmpty() ? gstNumber.trim() : "N/A");
            newVendor.setPhone(phone != null ? phone.trim() : "");
            newVendor.setEmail(email != null ? email.trim() : "");

            User saved = userRepository.save(newVendor);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Database Error: " + e.getMessage()));
        }
    }
}