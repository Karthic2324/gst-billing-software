package com.billing.backend.controller;

import com.billing.backend.model.Invoice;
import com.billing.backend.repository.InvoiceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceRepository invoiceRepository;

    public InvoiceController(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    // Create Invoice
    @PostMapping
    public ResponseEntity<?> createInvoice(@RequestBody Invoice invoice) {
        if (invoice.getItems() != null) {
            invoice.getItems().forEach(item -> item.setInvoice(invoice));
        }
        Invoice savedInvoice = invoiceRepository.save(invoice);
        return ResponseEntity.ok(savedInvoice);
    }

    // Get All Invoices
    @GetMapping
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        return ResponseEntity.ok(invoiceRepository.findAll());
    }

    // Get Invoice by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getInvoiceById(@PathVariable Long id) {
        return invoiceRepository.findById(id)
                .map(invoice -> ResponseEntity.ok((Object) invoice))
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Invoice not found")));
    }
}