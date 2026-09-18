package com.billing.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "invoice_items")
@Data
public class InvoiceItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer sNo;
    private String itemDescription;
    private String hsnSac;
    private Integer qty;
    private String unit;
    private Double rate;
    private Double taxAmount;
    private Double amount;
}