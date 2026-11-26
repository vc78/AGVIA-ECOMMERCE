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
 * Initializes Lokesh Lingam Weaver defaults without touching existing catalogue or order records:
 * - Ensures required database tables/columns exist
 * - Bootstraps the administrator user when configured/missing
 * - Ensures the 3 official Lokesh Lingam Weaver handloom saree categories exist
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Value("${app.admin.default-email:admin@lokeshlingam.local}")
    private String defaultAdminEmail;

    @Value("${app.admin.default-password:ChangeMe@2026}")
    private String defaultAdminPassword;

    @Value("${app.admin.default-name:Lokesh Lingam Weaver Admin}")
    private String defaultAdminName;

    @Override
    public void run(String... args) {
        ensureDatabaseTablesExist();
        bootstrapAdminUser();
        seedHandloomCategories();
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
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS return_requests (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    return_number VARCHAR(32) NOT NULL UNIQUE,
                    order_id BIGINT NOT NULL,
                    user_id BIGINT NOT NULL,
                    order_item_id BIGINT NULL,
                    type VARCHAR(20) NOT NULL,
                    reason VARCHAR(30) NOT NULL,
                    resolution VARCHAR(30) NOT NULL,
                    status VARCHAR(30) NOT NULL,
                    target_size VARCHAR(50) NULL,
                    target_color VARCHAR(100) NULL,
                    target_variant_id BIGINT NULL,
                    customer_notes VARCHAR(1000) NULL,
                    images_json TEXT NULL,
                    bank_details TEXT NULL,
                    pickup_address VARCHAR(500) NULL,
                    reverse_courier_partner VARCHAR(100) NULL,
                    reverse_tracking_number VARCHAR(100) NULL,
                    credit_coupon_code VARCHAR(50) NULL,
                    refund_amount DECIMAL(10, 2) NULL,
                    admin_notes VARCHAR(1000) NULL,
                    created_at DATETIME NULL,
                    updated_at DATETIME NULL,
                    INDEX idx_return_order_id (order_id),
                    INDEX idx_return_user_id (user_id),
                    INDEX idx_return_status (status),
                    INDEX idx_return_number (return_number)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """);
            log.info("Verified return_requests table in database");
        } catch (Exception ex) {
            log.warn("Notice checking return_requests table: {}", ex.getMessage());
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
            jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN tracking_token VARCHAR(64)");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN tracking_token_revoked BIT NOT NULL DEFAULT 0");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE orders MODIFY COLUMN tracking_token_revoked BIT NOT NULL DEFAULT 0");
        } catch (Exception ignored) {}
        try {
            // Self-healing synchronization: variants cannot relax parent product restrictions
            jdbcTemplate.execute("UPDATE product_variants pv INNER JOIN products p ON pv.product_id = p.id SET pv.payment_option = 'COD_ONLY' WHERE p.payment_option = 'COD_ONLY' AND (pv.payment_option IS NULL OR pv.payment_option != 'COD_ONLY')");
            jdbcTemplate.execute("UPDATE product_variants pv INNER JOIN products p ON pv.product_id = p.id SET pv.payment_option = 'ONLINE_ONLY' WHERE p.payment_option = 'ONLINE_ONLY' AND (pv.payment_option IS NULL OR pv.payment_option != 'ONLINE_ONLY')");
        } catch (Exception ignored) {}
    }

    private void bootstrapAdminUser() {
        bootstrapSingleAdmin(defaultAdminEmail, defaultAdminName, defaultAdminPassword);
    }

    private void bootstrapSingleAdmin(String email, String name, String password) {
        Optional<User> adminOpt = userRepository.findByEmail(email);
        if (adminOpt.isEmpty()) {
            User admin = User.builder()
                    .fullName(name)
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .role(Role.ROLE_ADMIN)
                    .enabled(true)
                    .phoneVerified(true)
                    .build();
            userRepository.save(admin);
            log.info("Lokesh Lingam Weaver Admin account initialized: {}", email);
        } else {
            User admin = adminOpt.get();
            admin.setRole(Role.ROLE_ADMIN);
            admin.setEnabled(true);
            userRepository.save(admin);
            log.info("Lokesh Lingam Weaver Admin account verified: {}", email);
        }
    }

    private void seedHandloomCategories() {
        log.info("Verifying Lokesh Lingam Weaver official handloom saree categories...");
        getOrCreateCategory("Dharmavaram Silk Sarees", "Traditional Dharmavaram handloom silk sarees directly from our looms.", "/images/dharmavaram_hero_campaign.jpg");
        getOrCreateCategory("Kanchi-Style Silk Sarees", "Kanchi-style silk sarees woven in Dharmavaram.", "/images/dharmavaram_collections_showcase.jpg");
        getOrCreateCategory("Traditional Handloom Weaves", "Authentic handloom weaves crafted with 15 years of weaving experience.", "/images/dharmavaram_loom_heritage.jpg");
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
}
