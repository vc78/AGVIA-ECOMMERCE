package com.ems.pragathisweets.entity;

/**
 * Product-level payment availability rules.
 * Determines whether patrons can purchase this silhouette via COD, Online Payment, or both.
 */
public enum ProductPaymentOption {
    COD_AND_ONLINE,
    COD_ONLY,
    ONLINE_ONLY
}
