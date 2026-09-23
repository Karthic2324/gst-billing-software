package com.billing.backend.controller;

import com.billing.backend.model.Invoice;
import com.billing.backend.model.InvoiceItem;
import com.billing.backend.model.Product;
import com.billing.backend.repository.InvoiceRepository;
import com.billing.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/invoices")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class InvoiceController {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private ProductRepository productRepository;

    @PostMapping
    public ResponseEntity<Invoice> createInvoice(@RequestBody Invoice invoice) {
        // 1. Save complete invoice data (includes nested items and tax breakdowns)
        Invoice savedInvoice = invoiceRepository.save(invoice);

        // 2. Automatically store new products in the master catalog for future auto-complete
        if (invoice.getItems() != null) {
            for (InvoiceItem item : invoice.getItems()) {
                if (item.getItemDescription() != null && !item.getItemDescription().trim().isEmpty()) {
                    String desc = item.getItemDescription().trim();
                    Optional<Product> existingOpt = productRepository.findByItemDescriptionIgnoreCase(desc);

                    Product product = existingOpt.orElse(new Product());
                    product.setItemDescription(desc);
                    product.setHsnSac(item.getHsnSac());
                    product.setRate(item.getRate());

                    productRepository.save(product);
                }
            }
        }

        return ResponseEntity.ok(savedInvoice);
    }

    @GetMapping
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoiceById(@PathVariable Long id) {
        return invoiceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/next-number")
    public ResponseEntity<Map<String, String>> getNextInvoiceNumber() {
        Optional<Invoice> lastInvoiceOpt = invoiceRepository.findTopByOrderByIdDesc();
        
        String nextInvoiceNo = "MB/SL/26-27/1001";

        if (lastInvoiceOpt.isPresent()) {
            String lastNo = lastInvoiceOpt.get().getInvoiceNo();
            try {
                int lastSlashIndex = lastNo.lastIndexOf('/');
                if (lastSlashIndex != -1) {
                    String prefix = lastNo.substring(0, lastSlashIndex + 1);
                    String numberPart = lastNo.substring(lastSlashIndex + 1);
                    int nextSeq = Integer.parseInt(numberPart) + 1;
                    nextInvoiceNo = prefix + nextSeq;
                }
            } catch (Exception e) {
                nextInvoiceNo = "MB/SL/26-27/" + (System.currentTimeMillis() % 10000);
            }
        }

        Map<String, String> response = new HashMap<>();
        response.put("nextInvoiceNo", nextInvoiceNo);
        return ResponseEntity.ok(response);
    }
}