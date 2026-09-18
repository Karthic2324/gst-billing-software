package com.billing.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "tax_breakdown")
@Data
public class TaxBreakdown {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String hsnSac;
    private Double taxableValue;
    private Double cgstRate;
    private Double cgstAmount;
    private Double sgstRate;
    private Double sgstAmount;
}