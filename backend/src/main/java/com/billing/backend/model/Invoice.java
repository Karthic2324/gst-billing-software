package com.billing.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "invoices")
@Data
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String invoiceNo;
    private LocalDate invoiceDate;

    private String sellerName;
    private String sellerAddress;
    private String sellerGstin;
    private String sellerEmail;

    private String buyerName;
    private String buyerAddress;
    private String buyerGstin;
    private String buyerPan;

    private String shippingAddress;
    private String placeOfSupply;

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "invoice_id")
    private List<InvoiceItem> items;

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "invoice_id")
    private List<TaxBreakdown> taxBreakdowns;

    private Integer totalQty;
    private Double totalTax;
    private Double totalAmount;
    private Double receivedAmount;

    private String bankName;
    private String bankIfsc;
    private String bankAccountNo;
}