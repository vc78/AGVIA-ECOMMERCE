package com.ems.pragathisweets.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${spring.datasource.url:}")
    private String rawUrl;

    @Value("${spring.datasource.username:}")
    private String username;

    @Value("${spring.datasource.password:}")
    private String password;

    @Value("${spring.datasource.driver-class-name:com.mysql.cj.jdbc.Driver}")
    private String driverClassName;

    private static final String DEFAULT_AIVEN_URL =
            "jdbc:mysql://mysql-2b47628b-agvia-123.k.aivencloud.com:11088/defaultdb?sslMode=REQUIRED&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    private static final String DEFAULT_AIVEN_USER = "avnadmin";

    @Bean
    @Primary
    public DataSource dataSource() {
        String cleanUrl = sanitizeJdbcUrl(rawUrl);
        String cleanUser = resolveUsername(username, cleanUrl);
        String cleanPass = resolvePassword(password, cleanUrl);

        if (cleanPass.isBlank()) {
            log.warn("[DataSourceConfig] Database password is not set! Ensure DB_PASSWORD is configured in Render environment variables.");
        }

        log.info("Configuring DataSource with sanitized JDBC URL: {}, user: {}", maskUrl(cleanUrl), cleanUser);

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(cleanUrl);
        config.setUsername(cleanUser);
        config.setPassword(cleanPass);
        config.setDriverClassName(driverClassName);
        config.setPoolName("LokeshLingamWeaverHikariPool");
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(300000); // 5 minutes (must be greater than keepaliveTime)
        config.setConnectionTimeout(30000); // 30s connection timeout
        config.setMaxLifetime(900000); // 15 minutes max connection lifetime
        config.setKeepaliveTime(30000); // 30s keepalive ping prevents cloud NAT routers from dropping idle TCP connections
        config.setInitializationFailTimeout(60000); // Wait up to 60s for cloud DB initialization before failing
        config.setLeakDetectionThreshold(60000); // 60s leak detection alerts if a connection is retained excessively

        return new HikariDataSource(config);
    }

    private String resolveUsername(String user, String url) {
        String resolved = user != null ? user.trim() : "";
        if (resolved.isBlank()) {
            resolved = System.getenv("DB_USER");
            if (resolved == null || resolved.isBlank()) {
                resolved = System.getenv("DB_USERNAME");
            }
        }
        if (resolved == null || resolved.isBlank()) {
            resolved = extractUserInfoFromUrl(url, 0);
        }
        if (resolved == null || resolved.isBlank()) {
            resolved = DEFAULT_AIVEN_USER;
        }
        return stripQuotes(resolved);
    }

    private String resolvePassword(String pass, String url) {
        String resolved = pass != null ? pass.trim() : "";
        if (resolved.isBlank()) {
            resolved = System.getenv("DB_PASSWORD");
        }
        if (resolved == null || resolved.isBlank()) {
            resolved = System.getenv("MYSQL_PASSWORD");
        }
        if (resolved == null || resolved.isBlank()) {
            resolved = System.getenv("DATABASE_PASSWORD");
        }
        if (resolved == null || resolved.isBlank()) {
            resolved = extractUserInfoFromUrl(url, 1);
        }
        return stripQuotes(resolved);
    }

    private String extractUserInfoFromUrl(String url, int index) {
        if (url == null || !url.contains("@")) return "";
        try {
            String stripped = url.replace("jdbc:", "");
            java.net.URI uri = java.net.URI.create(stripped);
            if (uri.getUserInfo() != null) {
                String[] parts = uri.getUserInfo().split(":", 2);
                if (index < parts.length) {
                    return parts[index];
                }
            }
        } catch (Exception ignored) {}
        return "";
    }

    private String stripQuotes(String str) {
        if (str == null) return "";
        String trimmed = str.trim();
        if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            trimmed = trimmed.substring(1, trimmed.length() - 1).trim();
        }
        return trimmed;
    }

    /**
     * Resiliently strips accidental env variable prefixes like "DB_URL=" or surrounding quotes.
     */
    private String sanitizeJdbcUrl(String url) {
        String target = url != null ? url.trim() : "";
        if (target.isBlank()) {
            target = System.getenv("DB_URL");
        }
        if (target == null || target.isBlank()) {
            return DEFAULT_AIVEN_URL;
        }
        String trimmed = target.trim();
        if (trimmed.startsWith("DB_URL=")) {
            trimmed = trimmed.substring("DB_URL=".length()).trim();
        } else if (trimmed.startsWith("spring.datasource.url=")) {
            trimmed = trimmed.substring("spring.datasource.url=".length()).trim();
        }
        return stripQuotes(trimmed);
    }

    private String maskUrl(String url) {
        if (url == null) return "null";
        return url.replaceAll("password=[^&]*", "password=***");
    }
}
