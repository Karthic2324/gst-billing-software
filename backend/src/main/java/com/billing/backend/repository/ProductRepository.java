package com.billing.backend.repository;

import com.billing.backend.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByItemDescriptionContainingIgnoreCase(String query);
    Optional<Product> findByItemDescriptionIgnoreCase(String itemDescription);
}