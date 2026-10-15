package com.billing.backend.controller;

import com.billing.backend.model.User;
import com.billing.backend.repository.UserRepository;
import com.billing.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

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
        String username = request.get("username");
        String password = request.get("password");

        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username and password are required."));
        }

        Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(username.trim());

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid username or password."));
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(password.trim(), user.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid username or password."));
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

        return ResponseEntity.ok(Map.of(
            "token", token,
            "role", user.getRole(),
            "userId", user.getId(),
            "businessName", user.getBusinessName() != null ? user.getBusinessName() : "OM MURUGA AUTO ELECTRICAL WORKS",
            "gstNumber", user.getGstNumber() != null ? user.getGstNumber() : "33DSSPS7678B1Z2",
            "address", user.getAddress() != null ? user.getAddress() : "NO. 214 Sakthi Nagar, Main Road, Coimbatore, Tamil Nadu, 641006",
            "email", user.getEmail() != null ? user.getEmail() : "om.muruga.electricals@gmail.com",
            "bankName", user.getBankName() != null ? user.getBankName() : "ICICI Bank",
            "bankAccountNo", user.getBankAccountNo() != null ? user.getBankAccountNo() : "417905500050",
            "bankIfsc", user.getBankIfsc() != null ? user.getBankIfsc() : "ICIC0004179",
            "bankBranch", user.getBankBranch() != null ? user.getBankBranch() : "Coimbatore Main Branch"
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
        user.setBusinessName("OM MURUGA AUTO ELECTRICAL WORKS");
        user.setGstNumber("33DSSPS7678B1Z2");
        user.setAddress("NO. 214 Sakthi Nagar, Main Road, Coimbatore, Tamil Nadu, 641006");
        user.setEmail("om.muruga.electricals@gmail.com");
        user.setBankName("ICICI Bank");
        user.setBankAccountNo("417905500050");
        user.setBankIfsc("ICIC0004179");
        user.setBankBranch("Coimbatore Main Branch");

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Vendor account created/updated with encoded password successfully!"));
    }
}