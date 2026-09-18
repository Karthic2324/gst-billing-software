package com.billing.backend.controller;

import com.billing.backend.model.Product;
import com.billing.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:3000")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    // Get search suggestions based on what the user types
    @GetMapping("/search")
    public ResponseEntity<List<Product>> searchProducts(@RequestParam("query") String query) {
        List<Product> matches = productRepository.findByItemDescriptionContainingIgnoreCase(query);
        return ResponseEntity.ok(matches);
    }

    // Save or update product details automatically
    @PostMapping
    public ResponseEntity<Product> saveOrUpdateProduct(@RequestBody Product product) {
        return productRepository.findByItemDescriptionIgnoreCase(product.getItemDescription())
                .map(existing -> {
                    existing.setHsnSac(product.getHsnSac());
                    existing.setRate(product.getRate());
                    return ResponseEntity.ok(productRepository.save(existing));
                })
                .orElseGet(() -> ResponseEntity.ok(productRepository.save(product)));
    }
}