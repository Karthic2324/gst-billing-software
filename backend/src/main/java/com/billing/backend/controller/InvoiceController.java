package com.billing.backend.controller;

import com.billing.backend.model.Invoice;
import com.billing.backend.model.User;
import com.billing.backend.repository.InvoiceRepository;
import com.billing.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping
    public ResponseEntity<?> createInvoice(@RequestBody Invoice invoice, Authentication authentication) {
        String username = authentication.getName();
        User vendor = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Vendor account not found"));

        invoice.setVendor(vendor);
        Invoice saved = invoiceRepository.save(invoice);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/my-history")
    public ResponseEntity<List<Invoice>> getMyHistory(Authentication authentication) {
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if ("ROLE_ADMIN".equals(currentUser.getRole())) {
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