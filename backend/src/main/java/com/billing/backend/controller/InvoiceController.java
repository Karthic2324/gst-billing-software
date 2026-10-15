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

    // Handles both POST /api/invoices and POST /api/invoices/create
    @PostMapping({"", "/create"})
    public ResponseEntity<?> createInvoice(@RequestBody Invoice invoice, Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            String identifier = authentication.getName();
            User vendor = userRepository.findByEmail(identifier)
                    .orElseGet(() -> userRepository.findByUsername(identifier)
                            .orElseGet(() -> userRepository.findByUsernameIgnoreCase(identifier).orElse(null)));

            if (vendor != null) {
                invoice.setVendor(vendor);
            }
        }

        if (invoice.getCreatedAt() == null) {
            invoice.setCreatedAt(LocalDateTime.now());
        }

        // Link child items to the parent invoice for cascade persistence
        if (invoice.getItems() != null) {
            invoice.getItems().forEach(item -> item.setInvoice(invoice));
        }

        Invoice saved = invoiceRepository.save(invoice);
        return ResponseEntity.ok(saved);
    }

    // Handles both GET /api/invoices and GET /api/invoices/my-history
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

    @GetMapping("/admin/vendor/{vendorId}")
    public ResponseEntity<List<Invoice>> getVendorHistoryForAdmin(@PathVariable Long vendorId) {
        return ResponseEntity.ok(invoiceRepository.findByVendorIdOrderByIdDesc(vendorId));
    }
}