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
        String email = request.get("email");
        String password = request.get("password");

        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (passwordEncoder.matches(password, user.getPassword())) {
                String token = jwtUtil.generateToken(user.getEmail(), user.getRole());

                Map<String, Object> response = new HashMap<>();
                response.put("token", token);
                response.put("id", user.getId());
                response.put("businessName", user.getBusinessName() != null ? user.getBusinessName() : "Om Muruga Auto Electrical Works");
                response.put("gstNumber", user.getGstNumber() != null ? user.getGstNumber() : "33DSSPS7678B1Z2");
                response.put("address", user.getAddress() != null ? user.getAddress() : "6/1, Siddhi Vinayagar Colony, Linganoor, Siruvani Road, Veerakeralam, Coimbatore - 641 007.");
                response.put("email", user.getEmail());
                response.put("phone", user.getPhone() != null ? user.getPhone() : "9976765151 / 8098986464");
                response.put("bankName", user.getBankName() != null ? user.getBankName() : "ICICI Bank");
                response.put("bankAccountNo", user.getBankAccountNo() != null ? user.getBankAccountNo() : "417905500050");
                response.put("bankIfsc", user.getBankIfsc() != null ? user.getBankIfsc() : "ICIC0004179");
                response.put("bankBranch", user.getBankBranch() != null ? user.getBankBranch() : "Coimbatore");

                return ResponseEntity.ok(response);
            }
        }

        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", "Invalid email or password");
        return ResponseEntity.status(401).body(errorResponse);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Email already in use");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("ROLE_VENDOR");
        }

        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(savedUser);
    }
}