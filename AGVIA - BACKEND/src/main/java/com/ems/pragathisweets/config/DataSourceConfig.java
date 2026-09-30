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

    @Value("${spring.datasource.url}")
    private String rawUrl;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password:}")
    private String password;

    @Value("${spring.datasource.driver-class-name:com.mysql.cj.jdbc.Driver}")
    private String driverClassName;

    @Bean
    @Primary
    public DataSource dataSource() {
        String cleanUrl = sanitizeJdbcUrl(rawUrl);
        log.info("Configuring DataSource with sanitized JDBC URL: {}", maskUrl(cleanUrl));

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(cleanUrl);
        config.setUsername(username != null ? username.trim() : "avnadmin");
        config.setPassword(password != null ? password.trim() : "");
        config.setDriverClassName(driverClassName);
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(30000);
        config.setConnectionTimeout(20000);
        config.setMaxLifetime(1800000);

        return new HikariDataSource(config);
    }

    /**
     * Resiliently strips accidental env variable prefixes like "DB_URL=" or surrounding quotes.
     */
    private String sanitizeJdbcUrl(String url) {
        if (url == null) {
            return "jdbc:mysql://mysql-20386652-agvia.a.aivencloud.com:14519/defaultdb?sslMode=REQUIRED&allowPublicKeyRetrieval=true&serverTimezone=UTC";
        }
        String trimmed = url.trim();
        if (trimmed.startsWith("DB_URL=")) {
            trimmed = trimmed.substring("DB_URL=".length()).trim();
        } else if (trimmed.startsWith("spring.datasource.url=")) {
            trimmed = trimmed.substring("spring.datasource.url=".length()).trim();
        }
        if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            trimmed = trimmed.substring(1, trimmed.length() - 1).trim();
        }
        return trimmed;
    }

    private String maskUrl(String url) {
        if (url == null) return "null";
        return url.replaceAll("password=[^&]*", "password=***");
    }
}
