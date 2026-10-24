package com.billing.backend.controller;

import com.billing.backend.model.Invoice;
import com.billing.backend.model.InvoiceItem;
import com.billing.backend.model.User;
import com.billing.backend.repository.InvoiceRepository;
import com.billing.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
        try {
            if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName())) {
                String identifier = authentication.getName();
                User vendor = userRepository.findByEmail(identifier)
                        .orElseGet(() -> userRepository.findByUsername(identifier)
                                .orElseGet(() -> userRepository.findByUsernameIgnoreCase(identifier).orElse(null)));
                if (vendor != null) {
                    invoice.setVendor(vendor);
                }
            }

            if (invoice.getVendor() == null) {
                userRepository.findByUsernameIgnoreCase("Omaew").ifPresent(invoice::setVendor);
            }

            if (invoice.getCreatedAt() == null) {
                invoice.setCreatedAt(LocalDateTime.now());
            }

            if (invoice.getItems() != null) {
                for (InvoiceItem item : invoice.getItems()) {
                    item.setInvoice(invoice);
                }
            }

            Invoice saved = invoiceRepository.save(invoice);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "SUCCESS");
            response.put("message", "Invoice saved successfully");
            response.put("id", saved.getId());
            response.put("createdAt", saved.getCreatedAt());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to save invoice: " + e.getMessage()));
        }
    }

    @GetMapping({"", "/my-history"})
    public ResponseEntity<?> getMyHistory(Authentication authentication) {
        try {
            if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName())) {
                String identifier = authentication.getName();
                User currentUser = userRepository.findByEmail(identifier)
                        .orElseGet(() -> userRepository.findByUsername(identifier)
                                .orElseGet(() -> userRepository.findByUsernameIgnoreCase(identifier).orElse(null)));

                if (currentUser != null && currentUser.getId() != null) {
                    if ("ROLE_ADMIN".equalsIgnoreCase(currentUser.getRole()) || "ADMIN".equalsIgnoreCase(currentUser.getRole())) {
                        return ResponseEntity.ok(invoiceRepository.findAllByOrderByIdDesc());
                    } else {
                        List<Invoice> vendorInvoices = invoiceRepository.findByVendorIdOrderByIdDesc(currentUser.getId());
                        if (vendorInvoices != null && !vendorInvoices.isEmpty()) {
                            return ResponseEntity.ok(vendorInvoices);
                        }
                    }
                }
            }
            return ResponseEntity.ok(invoiceRepository.findAllByOrderByIdDesc());
        } catch (Exception e) {
            System.err.println("Error inside getMyHistory: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(invoiceRepository.findAllByOrderByIdDesc());
        }
    }
}