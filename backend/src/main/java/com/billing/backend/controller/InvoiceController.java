package com.billing.backend.controller;

import com.billing.backend.model.Invoice;
import com.billing.backend.model.User;
import com.billing.backend.repository.InvoiceRepository;
import com.billing.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;

    public InvoiceController(InvoiceRepository invoiceRepository, UserRepository userRepository) {
        this.invoiceRepository = invoiceRepository;
        this.userRepository = userRepository;
    }

@PostMapping({"", "/create"})
    public ResponseEntity<?> createInvoice(@RequestBody Invoice invoice, Authentication authentication) {
        // 1. Try to set vendor from authenticated token if present
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName())) {
            String identifier = authentication.getName();
            User vendor = userRepository.findByEmail(identifier)
                    .orElseGet(() -> userRepository.findByUsername(identifier)
                            .orElseGet(() -> userRepository.findByUsernameIgnoreCase(identifier).orElse(null)));

            if (vendor != null) {
                invoice.setVendor(vendor);
            }
        }

        // 2. Fallback: If no valid auth context, assign default vendor Omaew
        if (invoice.getVendor() == null) {
            userRepository.findByUsernameIgnoreCase("Omaew").ifPresent(invoice::setVendor);
        }

        // 3. Set creation date if missing
        if (invoice.getCreatedAt() == null) {
            invoice.setCreatedAt(LocalDateTime.now());
        }

        // 4. Bind parent invoice reference to child items for JPA cascade
        if (invoice.getItems() != null) {
            invoice.getItems().forEach(item -> item.setInvoice(invoice));
        }

        // 5. Save directly to Neon PostgreSQL database
        Invoice saved = invoiceRepository.save(invoice);
        return ResponseEntity.ok(saved);
    }

    @GetMapping({"", "/my-history"})
    public ResponseEntity<List<Invoice>> getMyHistory(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String identifier = authentication.getName();
        User currentUser = userRepository.findByEmail(identifier)
                .orElseGet(() -> userRepository.findByUsername(identifier)
                        .orElseGet(() -> userRepository.findByUsernameIgnoreCase(identifier)
                                .orElseThrow(() -> new RuntimeException("User not found"))));

        if ("ROLE_ADMIN".equals(currentUser.getRole()) || "ADMIN".equals(currentUser.getRole())) {
            return ResponseEntity.ok(invoiceRepository.findAllByOrderByIdDesc());
        } else {
            return ResponseEntity.ok(invoiceRepository.findByVendorIdOrderByIdDesc(currentUser.getId()));
        }
    }
}