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
    public ResponseEntity<?> login(@RequestBody Map<String, Object> request) {
        String input = request.get("username") != null ? request.get("username").toString().trim() : null;
        if (input == null || input.isEmpty()) {
            input = request.get("email") != null ? request.get("email").toString().trim() : null;
        }

        String password = request.get("password") != null ? request.get("password").toString().trim() : null;

        if (input == null || password == null || input.isEmpty() || password.isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Username/Email and Password are required");
            return ResponseEntity.badRequest().body(err);
        }

        // Look up by Email or Username (Case-Insensitive)
        Optional<User> userOpt = userRepository.findByEmail(input);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByUsername(input);
        }
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByUsernameIgnoreCase(input);
        }

        User user;
        if (userOpt.isPresent()) {
            user = userOpt.get();
            boolean matches = false;

            try {
                matches = passwordEncoder.matches(password, user.getPassword());
            } catch (Exception e) {
                matches = false;
            }

            // Automatic password reset/healing for development account
            if (!matches) {
                if (("Omaew".equalsIgnoreCase(input) || "omaew@gmail.com".equalsIgnoreCase(input)) && "omaew@27".equals(password)) {
                    user.setPassword(passwordEncoder.encode("omaew@27"));
                    userRepository.save(user);
                    matches = true;
                } else {
                    Map<String, String> err = new HashMap<>();
                    err.put("error", "Invalid username or password");
                    return ResponseEntity.status(401).body(err);
                }
            }
        } else {
            // Auto-create Omaew account if missing
            if (("Omaew".equalsIgnoreCase(input) || "omaew@gmail.com".equalsIgnoreCase(input)) && "omaew@27".equals(password)) {
                user = new User();
                user.setUsername("Omaew");
                user.setEmail("omaew@gmail.com");
                user.setPassword(passwordEncoder.encode("omaew@27"));
                user.setRole("ROLE_VENDOR");
                user.setBusinessName("Om Muruga Auto Electrical Works");
                user.setGstNumber("33DSSPS7678B1Z2");
                user.setAddress("6/1, Siddhi Vinayagar Colony, Linganoor, Siruvani Road, Veerakeralam, Coimbatore - 641 007.");
                user.setPhone("9976765151 / 8098986464");
                user.setBankName("ICICI Bank");
                user.setBankAccountNo("417905500050");
                user.setBankIfsc("ICIC0004179");
                user.setBankBranch("Coimbatore");
                user = userRepository.save(user);
            } else {
                Map<String, String> err = new HashMap<>();
                err.put("error", "Invalid username or password");
                return ResponseEntity.status(401).body(err);
            }
        }

        String token = jwtUtil.generateToken(
            user.getEmail() != null ? user.getEmail() : user.getUsername(),
            user.getRole() != null ? user.getRole() : "ROLE_VENDOR"
        );

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("id", user.getId());
        response.put("userId", user.getId());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("role", user.getRole() != null ? user.getRole() : "ROLE_VENDOR");
        response.put("businessName", user.getBusinessName() != null ? user.getBusinessName() : user.getUsername());
        response.put("gstNumber", user.getGstNumber() != null ? user.getGstNumber() : "N/A");
        response.put("phone", user.getPhone() != null ? user.getPhone() : "");

        return ResponseEntity.ok(response);
    }
}