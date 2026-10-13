package com.billing.backend.repository;

import com.billing.backend.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByVendorIdOrderByIdDesc(Long vendorId);
    List<Invoice> findAllByOrderByIdDesc();
}