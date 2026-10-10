package com.billing.backend.controller;

import com.billing.backend.model.Vendor;
import com.billing.backend.repository.VendorRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vendor")
public class VendorController {

    private final VendorRepository vendorRepository;

    public VendorController(VendorRepository vendorRepository) {
        this.vendorRepository = vendorRepository;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
            "message", "Welcome to the Protected Vendor Dashboard!",
            "user", authentication.getName()
        ));
    }

    // 1. Create Vendor Profile
    @PostMapping("/profile")
    public ResponseEntity<?> createVendor(@RequestBody Vendor vendor) {
        if (vendorRepository.existsByEmail(vendor.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Vendor email already exists"));
        }
        Vendor savedVendor = vendorRepository.save(vendor);
        return ResponseEntity.ok(savedVendor);
    }

    // 2. Fetch All Vendors
    @GetMapping("/all")
    public ResponseEntity<List<Vendor>> getAllVendors() {
        return ResponseEntity.ok(vendorRepository.findAll());
    }

    // 3. Fetch Single Vendor by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getVendorById(@PathVariable Long id) {
        return vendorRepository.findById(id)
                .map(vendor -> ResponseEntity.ok((Object) vendor))
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Vendor not found")));
    }

    // 4. Update Vendor
    @PutMapping("/{id}")
    public ResponseEntity<?> updateVendor(@PathVariable Long id, @RequestBody Vendor updatedVendor) {
        return vendorRepository.findById(id)
                .map(vendor -> {
                    vendor.setBusinessName(updatedVendor.getBusinessName());
                    vendor.setPhone(updatedVendor.getPhone());
                    vendor.setAddress(updatedVendor.getAddress());
                    vendor.setStatus(updatedVendor.getStatus());
                    vendorRepository.save(vendor);
                    return ResponseEntity.ok((Object) vendor);
                })
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Vendor not found")));
    }

    // 5. Delete Vendor
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVendor(@PathVariable Long id) {
        if (!vendorRepository.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of("error", "Vendor not found"));
        }
        vendorRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Vendor deleted successfully"));
    }
}