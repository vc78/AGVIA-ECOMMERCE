package com.ems.pragathisweets.config;

import com.ems.pragathisweets.entity.Category;
import com.ems.pragathisweets.entity.Product;
import com.ems.pragathisweets.entity.Role;
import com.ems.pragathisweets.entity.User;
import com.ems.pragathisweets.repository.CategoryRepository;
import com.ems.pragathisweets.repository.ProductRepository;
import com.ems.pragathisweets.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * Initializes AGVIA Women's Wear Boutique:
 * - Bootstraps the default AGVIA Administrator account (admin@agvia.com)
 * - Seeds the 7 official AGVIA categories
 * - Seeds the exact 10 official AGVIA products with local fashion imagery
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final com.ems.pragathisweets.repository.CouponRepository couponRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Value("${app.admin.default-email:admin@agvia.com}")
    private String defaultAdminEmail;

    @Value("${app.admin.default-password:agvia@123}")
    private String defaultAdminPassword;

    @Value("${app.admin.default-name:AGVIA Administrator}")
    private String defaultAdminName;

    @Override
    public void run(String... args) {
        ensureDatabaseTablesExist();
        bootstrapAdminUser();
        seedAgviaCategoriesAndProducts();
        patchProductImages();
        seedOfficialCoupons();
    }

    private void ensureDatabaseTablesExist() {
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS analytics_events (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    event_type VARCHAR(50) NOT NULL,
                    visitor_id VARCHAR(64) NOT NULL,
                    session_id VARCHAR(64) NOT NULL,
                    user_id BIGINT,
                    product_id BIGINT,
                    page_path VARCHAR(255),
                    page_title VARCHAR(150),
                    referrer VARCHAR(255),
                    device_type VARCHAR(20),
                    share_method VARCHAR(30),
                    quantity INT,
                    created_at DATETIME NOT NULL,
                    INDEX idx_ae_created_at (created_at),
                    INDEX idx_ae_event_type (event_type),
                    INDEX idx_ae_event_created (event_type, created_at),
                    INDEX idx_ae_visitor_created (visitor_id, created_at),
                    INDEX idx_ae_session_created (session_id, created_at),
                    INDEX idx_ae_product_id (product_id),
                    INDEX idx_ae_page_path (page_path)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """);
            log.info("Verified analytics_events table in database");
        } catch (Exception ex) {
            log.warn("Notice checking analytics_events table: {}", ex.getMessage());
        }

        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS auth_otp_challenges (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    challenge_id VARCHAR(64) NOT NULL UNIQUE,
                    user_id BIGINT,
                    phone_number VARCHAR(30) NOT NULL,
                    purpose VARCHAR(30) NOT NULL,
                    otp_hash VARCHAR(120) NOT NULL,
                    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                    expires_at DATETIME NOT NULL,
                    attempt_count INT NOT NULL DEFAULT 0,
                    max_attempts INT NOT NULL DEFAULT 5,
                    resend_count INT NOT NULL DEFAULT 0,
                    last_sent_at DATETIME NOT NULL,
                    verified_at DATETIME,
                    consumed_at DATETIME,
                    ip_address VARCHAR(45),
                    user_agent VARCHAR(255),
                    registration_name VARCHAR(120),
                    registration_email VARCHAR(150),
                    registration_password_hash VARCHAR(120),
                    registration_address VARCHAR(500),
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME,
                    INDEX idx_challenge_id (challenge_id),
                    INDEX idx_otp_phone (phone_number),
                    INDEX idx_otp_expires_at (expires_at),
                    INDEX idx_otp_status (status),
                    INDEX idx_otp_purpose (purpose)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """);
            log.info("Verified auth_otp_challenges table in database");
        } catch (Exception ex) {
            log.warn("Notice checking auth_otp_challenges table: {}", ex.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN phone VARCHAR(20)");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN phone_verified BOOLEAN NOT NULL DEFAULT FALSE");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE products ADD COLUMN payment_option VARCHAR(20) DEFAULT 'COD_AND_ONLINE'");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE product_variants ADD COLUMN payment_option VARCHAR(20) DEFAULT 'COD_AND_ONLINE'");
        } catch (Exception ignored) {}
        try {
            // Self-healing synchronization: variants cannot relax parent product restrictions
            jdbcTemplate.execute("UPDATE product_variants pv INNER JOIN products p ON pv.product_id = p.id SET pv.payment_option = 'COD_ONLY' WHERE p.payment_option = 'COD_ONLY' AND (pv.payment_option IS NULL OR pv.payment_option != 'COD_ONLY')");
            jdbcTemplate.execute("UPDATE product_variants pv INNER JOIN products p ON pv.product_id = p.id SET pv.payment_option = 'ONLINE_ONLY' WHERE p.payment_option = 'ONLINE_ONLY' AND (pv.payment_option IS NULL OR pv.payment_option != 'ONLINE_ONLY')");
        } catch (Exception ignored) {}
    }

    private void bootstrapAdminUser() {
        Optional<User> adminOpt = userRepository.findByEmail(defaultAdminEmail);
        if (adminOpt.isEmpty()) {
            User admin = User.builder()
                    .fullName(defaultAdminName)
                    .email(defaultAdminEmail)
                    .password(passwordEncoder.encode(defaultAdminPassword))
                    .role(Role.ROLE_ADMIN)
                    .enabled(true)
                    .phoneVerified(true)
                    .build();
            userRepository.save(admin);
            log.info("AGVIA Admin account initialized successfully: {}", defaultAdminEmail);
        } else {
            User admin = adminOpt.get();
            admin.setRole(Role.ROLE_ADMIN);
            admin.setEnabled(true);
            admin.setPassword(passwordEncoder.encode(defaultAdminPassword));
            userRepository.save(admin);
            log.info("AGVIA Admin account verified and credentials synchronized: {}", defaultAdminEmail);
        }
    }

    private void seedAgviaCategoriesAndProducts() {
        log.info("Seeding AGVIA official categories and 10 catalog products...");

        Category sarees = getOrCreateCategory("Sarees", "Elegant silk, organza, and festive sarees crafted for special occasions.", "/images/classic_silk_saree.jpg");
        Category lehengas = getOrCreateCategory("Lehengas", "Bridal and festive lehengas with regal silhouettes and intricate embroidery.", "/images/wedding_lehenga.jpg");
        Category anarkalis = getOrCreateCategory("Anarkalis & Kurtas", "Flowing Anarkalis and comfortable designer kurta sets for every celebration.", "/images/anarkali_set.jpg");
        Category dresses = getOrCreateCategory("Dresses & Gowns", "Graceful evening gowns and contemporary occasion wear.", "/images/evening_gown.jpg");
        Category western = getOrCreateCategory("Western Wear", "Chic modern co-ord sets and versatile everyday contemporary pieces.", "/images/coord_set.jpg");
        Category kurtis = getOrCreateCategory("Kurtis", "Everyday and festive kurtis designed with timeless Indian charm.", "/images/festive_kurti.jpg");
        Category dupattas = getOrCreateCategory("Dupattas", "Embellished and sheer bridal dupattas to complete festive looks.", "/images/bridal_dupatta.jpg");

        // Exactly 26 AGVIA Catalog Products — every product has a unique image
        seedProductIfAbsent("AGVIA Classic Silk Saree", "Elegant silk saree for festive occasions, family functions and traditional celebrations.", "AGV-SAR-001", "4999.00", 25, "piece", "/images/classic_silk_saree.jpg", sarees, true);
        seedProductIfAbsent("AGVIA Floral Organza Saree", "Lightweight organza saree with a soft floral look, ideal for festivals and evening occasions.", "AGV-SAR-002", "3999.00", 20, "piece", "/images/floral_organza_saree.jpg", sarees, false);
        seedProductIfAbsent("AGVIA Embroidered Anarkali Set", "Comfortable flowing Anarkali with delicate embroidery for festive and family occasions.", "AGV-ANK-003", "3499.00", 30, "set", "/images/anarkali_set.jpg", anarkalis, true);
        seedProductIfAbsent("AGVIA Everyday Kurta Set", "Simple and comfortable kurta set designed for everyday wear, college, office and casual occasions.", "AGV-ANK-004", "1999.00", 40, "set", "/images/everyday_kurta_set.jpg", anarkalis, false);
        seedProductIfAbsent("AGVIA Festive Lehenga Set", "Beautiful festive lehenga set with elegant detailing for weddings and celebrations.", "AGV-LEH-005", "5999.00", 15, "set", "/images/festive_lehenga_set.jpg", lehengas, true);
        seedProductIfAbsent("AGVIA Embroidered Wedding Lehenga", "Premium embroidered lehenga designed for weddings, receptions and special celebrations.", "AGV-LEH-006", "8999.00", 12, "set", "/images/wedding_lehenga.jpg", lehengas, true);
        seedProductIfAbsent("AGVIA Evening Gown", "Elegant evening gown with a graceful silhouette for parties, dinners and celebrations.", "AGV-DRS-007", "3499.00", 18, "piece", "/images/evening_gown.jpg", dresses, false);
        seedProductIfAbsent("AGVIA Co-ord Set", "Modern matching outfit designed for a clean, comfortable and stylish everyday look.", "AGV-WST-008", "1799.00", 35, "set", "/images/coord_set.jpg", western, false);
        seedProductIfAbsent("AGVIA Festive Kurti", "Easy-to-wear festive kurti with a simple ethnic design for everyday Indian occasions.", "AGV-KRT-009", "1499.00", 45, "piece", "/images/festive_kurti.jpg", kurtis, false);
        seedProductIfAbsent("AGVIA Bridal Dupatta", "Elegant embellished dupatta designed to complement festive and bridal outfits.", "AGV-DUP-010", "1299.00", 30, "piece", "/images/bridal_dupatta.jpg", dupattas, false);

        seedProductIfAbsent("AGVIA Kanjeevaram Temple Border Silk Saree", "Heirloom pure Kanjeevaram silk saree with rich gold zari temple border and pallu.", "AGV-SAR-011", "6499.00", 15, "piece", "/images/kanjeevaram_gold_silk_saree.jpg", sarees, true);
        seedProductIfAbsent("AGVIA Pastel Banarasi Georgette Saree", "Soft drape pastel saree with hand-woven zari buttas for day festivities.", "AGV-SAR-012", "4599.00", 18, "piece", "/images/pastel_banarasi_georgette_saree.jpg", sarees, false);
        seedProductIfAbsent("AGVIA Crimson Velvet Bridal Lehenga", "Exquisite bridal crimson velvet lehenga with handcrafted zardozi embroidery.", "AGV-LEH-013", "9999.00", 10, "set", "/images/royal_crimson_velvet_lehenga.jpg", lehengas, true);
        seedProductIfAbsent("AGVIA Champagne Mirror-Work Lehenga", "Light-catching festive lehenga with intricate mirror and threadwork detailing.", "AGV-LEH-014", "6999.00", 14, "set", "/images/champagne_mirror_work_lehenga.jpg", lehengas, false);
        seedProductIfAbsent("AGVIA Chikankari Angrakha Anarkali", "Graceful Lucknowi Chikankari angrakha style set with matching churidar.", "AGV-ANK-015", "3899.00", 22, "set", "/images/chikankari_angrakha_anarkali.jpg", anarkalis, false);
        seedProductIfAbsent("AGVIA Chanderi Silk Festive Kurta", "Breathable Chanderi silk kurta with foil print and delicate gotta patti work.", "AGV-ANK-016", "2499.00", 28, "set", "/images/chanderi_festive_kurta.jpg", anarkalis, false);
        seedProductIfAbsent("AGVIA Emerald Pleated Cocktail Gown", "Floor-sweeping pleated gown with an asymmetric neckline for gala receptions.", "AGV-DRS-017", "4299.00", 16, "piece", "/images/pexels-arina-krasnikova-5418894.jpg", dresses, false);
        seedProductIfAbsent("AGVIA Satin Wrap Resort Dress", "Sleek flowing satin wrap dress designed for modern evening soirées.", "AGV-DRS-018", "2799.00", 20, "piece", "/images/pexels-arina-krasnikova-5418928.jpg", dresses, false);
        seedProductIfAbsent("AGVIA Linen Blazer & Trousers Set", "Sophisticated contemporary co-ord set with clean lines and tailored fit.", "AGV-WST-019", "3199.00", 24, "set", "/images/pexels-ron-lach-8306359.jpg", western, false);
        seedProductIfAbsent("AGVIA Mulberry Tissue Silk Saree", "Ultra-luminous gold tissue saree woven with fine metallic threads for a magnificent festive radiance.", "AGV-SAR-005", "5499.00", 12, "piece", "/images/mulberry_tissue_silk_saree.jpg", sarees, false);
        seedProductIfAbsent("AGVIA Rose Gold Zardozi Lehenga", "Romantic pastel lehenga featuring subtle rose gold metallic threadwork and a sweetheart neckline blouse.", "AGV-LEH-010", "7999.00", 11, "set", "/images/rose_gold_zardozi_lehenga.jpg", lehengas, false);
        seedProductIfAbsent("AGVIA Emerald Velvet Festive Anarkali", "Opulent jewel-toned velvet suit set adorned with gold thread dori work and scalloped organza borders.", "AGV-ANK-021", "4499.00", 18, "set", "/images/pexels-monurblc-36786626.jpg", anarkalis, true);
        seedProductIfAbsent("AGVIA One-Shoulder Fluted Gown", "Dramatic single-shoulder gown tailored from stretch crepe with sculptural bodice pleats.", "AGV-DRS-022", "4799.00", 14, "piece", "/images/pexels-ron-lach-8386651.jpg", dresses, false);
        seedProductIfAbsent("AGVIA Crepe Cape & Pant Set", "Flowing asymmetrical cape overlay paired with high-waisted cigarette pants for evening events.", "AGV-WST-023", "2899.00", 22, "set", "/images/pexels-alyssa-degarde-149576050-10689371.jpg", western, false);
        seedProductIfAbsent("AGVIA Hand-Block Printed Silk Kurti", "Pure Chanderi silk kurti adorned with artisanal hand-block floral motifs and subtle metallic accents.", "AGV-KRT-024", "1899.00", 32, "piece", "/images/pexels-umudicreative-16440831.jpg", kurtis, false);

        log.info("AGVIA categories and 26 products initialization verified.");
    }

    private Category getOrCreateCategory(String name, String description, String imageUrl) {
        return categoryRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> categoryRepository.save(Category.builder()
                        .name(name)
                        .description(description)
                        .imageUrl(imageUrl)
                        .active(true)
                        .build()));
    }

    private void seedProductIfAbsent(String name, String description, String sku, String price, int stock, String unit, String image, Category category, boolean bestseller) {
        if (!productRepository.existsBySkuIgnoreCase(sku)) {
            productRepository.save(Product.builder()
                    .name(name)
                    .description(description)
                    .sku(sku)
                    .price(new BigDecimal(price))
                    .stockQuantity(stock)
                    .unit(unit)
                    .imageUrl(image)
                    .category(category)
                    .bestseller(bestseller)
                    .avgRating(0.0)
                    .numReviews(0)
                    .active(true)
                    .build());
        }
    }

    /**
     * Patches image URLs for already-seeded products so every product has a unique image.
     * Uses upsert-style update: only writes if the current image differs from the desired unique image.
     */
    private void patchProductImages() {
        log.info("Patching unique product images...");
        updateProductImageBySku("AGV-SAR-011", "/images/kanjeevaram_gold_silk_saree.jpg");
        updateProductImageBySku("AGV-SAR-012", "/images/pastel_banarasi_georgette_saree.jpg");
        updateProductImageBySku("AGV-SAR-005", "/images/mulberry_tissue_silk_saree.jpg");
        updateProductImageBySku("AGV-LEH-013", "/images/royal_crimson_velvet_lehenga.jpg");
        updateProductImageBySku("AGV-LEH-014", "/images/champagne_mirror_work_lehenga.jpg");
        updateProductImageBySku("AGV-LEH-010", "/images/rose_gold_zardozi_lehenga.jpg");
        updateProductImageBySku("AGV-ANK-015", "/images/chikankari_angrakha_anarkali.jpg");
        updateProductImageBySku("AGV-ANK-016", "/images/chanderi_festive_kurta.jpg");
        updateProductImageBySku("AGV-ANK-021", "/images/pexels-monurblc-36786626.jpg");
        updateProductImageBySku("AGV-DRS-017", "/images/pexels-arina-krasnikova-5418894.jpg");
        updateProductImageBySku("AGV-DRS-018", "/images/pexels-arina-krasnikova-5418928.jpg");
        updateProductImageBySku("AGV-DRS-022", "/images/pexels-ron-lach-8386651.jpg");
        updateProductImageBySku("AGV-WST-019", "/images/pexels-ron-lach-8306359.jpg");
        updateProductImageBySku("AGV-WST-023", "/images/pexels-alyssa-degarde-149576050-10689371.jpg");
        updateProductImageBySku("AGV-KRT-024", "/images/pexels-umudicreative-16440831.jpg");
        log.info("Product image patch completed.");
    }

    private void updateProductImageBySku(String sku, String newImageUrl) {
        productRepository.findBySkuIgnoreCase(sku).ifPresent(product -> {
            if (!newImageUrl.equals(product.getImageUrl())) {
                product.setImageUrl(newImageUrl);
                productRepository.save(product);
                log.info("Updated image for SKU {}: {}", sku, newImageUrl);
            }
        });
    }

    private void seedOfficialCoupons() {
        log.info("Seeding AGVIA official coupons and subscription codes...");
        seedCouponIfAbsent("CIRCLE15", "AGVIA Haute Circle VIP 15% Boutique Credit", com.ems.pragathisweets.entity.DiscountType.PERCENTAGE, new BigDecimal("15.00"), BigDecimal.ZERO, new BigDecimal("2000.00"));
        seedCouponIfAbsent("AGVIAVIP10", "Exclusive VIP 10% Boutique Discount", com.ems.pragathisweets.entity.DiscountType.PERCENTAGE, new BigDecimal("10.00"), BigDecimal.ZERO, new BigDecimal("2000.00"));
        seedCouponIfAbsent("AGVIA15", "VIP Welcome Voucher 15% Boutique Credit", com.ems.pragathisweets.entity.DiscountType.PERCENTAGE, new BigDecimal("15.00"), BigDecimal.ZERO, new BigDecimal("2000.00"));
        seedCouponIfAbsent("AGVIA10", "Special 10% Storewide Boutique Discount", com.ems.pragathisweets.entity.DiscountType.PERCENTAGE, new BigDecimal("10.00"), BigDecimal.ZERO, new BigDecimal("1500.00"));
        seedCouponIfAbsent("WELCOME10", "Welcome 10% Off on First Boutique Purchase", com.ems.pragathisweets.entity.DiscountType.PERCENTAGE, new BigDecimal("10.00"), BigDecimal.ZERO, new BigDecimal("1000.00"));
        seedCouponIfAbsent("FIRST50", "₹50 Flat Credit on Debut Order", com.ems.pragathisweets.entity.DiscountType.FLAT, new BigDecimal("50.00"), new BigDecimal("299.00"), new BigDecimal("50.00"));
        seedCouponIfAbsent("AZADI15", "15% Off Independence Celebration Offer", com.ems.pragathisweets.entity.DiscountType.PERCENTAGE, new BigDecimal("15.00"), new BigDecimal("499.00"), new BigDecimal("2000.00"));
        seedCouponIfAbsent("RAKHI200", "₹200 Off Raksha Bandhan Delight", com.ems.pragathisweets.entity.DiscountType.FLAT, new BigDecimal("200.00"), new BigDecimal("999.00"), new BigDecimal("200.00"));
        seedCouponIfAbsent("DIWALI2025", "25% Off Corporate Grandeur Bulk Order", com.ems.pragathisweets.entity.DiscountType.PERCENTAGE, new BigDecimal("25.00"), new BigDecimal("1499.00"), new BigDecimal("3000.00"));
        log.info("AGVIA official coupons verification completed.");
    }

    private void seedCouponIfAbsent(String code, String description, com.ems.pragathisweets.entity.DiscountType discountType, BigDecimal value, BigDecimal minOrder, BigDecimal maxDiscount) {
        if (!couponRepository.existsByCodeIgnoreCase(code)) {
            couponRepository.save(com.ems.pragathisweets.entity.Coupon.builder()
                    .code(code.toUpperCase())
                    .description(description)
                    .discountType(discountType)
                    .discountValue(value)
                    .minOrderAmount(minOrder != null ? minOrder : BigDecimal.ZERO)
                    .maxDiscountAmount(maxDiscount)
                    .validFrom(java.time.LocalDateTime.now().minusDays(1))
                    .validTo(java.time.LocalDateTime.now().plusYears(5))
                    .usageLimit(10000)
                    .usedCount(0)
                    .active(true)
                    .build());
            log.info("Initialized official coupon: {}", code);
        }
    }
}
