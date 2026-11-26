package com.ems.pragathisweets.util;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Shared input and media URL validation helpers to defend against Stored XSS and unsafe URL schemes.
 */
public final class SecuritySanitizer {

    private static final Pattern SAFE_DATA_IMAGE_PATTERN = Pattern.compile(
            "^data:image/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=\\s]+$",
            Pattern.CASE_INSENSITIVE
    );

    private SecuritySanitizer() {
    }

    /**
     * Validates that a stored image URL is either a relative app path, https URL,
     * local dev URL, or a base64 raster image data URI (rejecting javascript:, data:text/html, and SVG scripts).
     */
    public static String validateSafeImageUrl(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            return rawUrl;
        }
        String trimmed = rawUrl.trim();
        String lower = trimmed.toLowerCase(Locale.ROOT);

        if (lower.startsWith("/")) {
            if (lower.startsWith("//") || lower.contains("javascript:")) {
                throw new IllegalArgumentException("Invalid image path.");
            }
            return trimmed;
        }
        if (lower.startsWith("https://")) {
            return trimmed;
        }
        if (lower.startsWith("http://localhost:") || lower.startsWith("http://127.0.0.1:")) {
            return trimmed;
        }
        if (lower.startsWith("data:image/")) {
            if (SAFE_DATA_IMAGE_PATTERN.matcher(trimmed).matches()) {
                return trimmed;
            }
            throw new IllegalArgumentException("Unsupported image encoding. Only PNG, JPEG, WebP, or GIF images are permitted.");
        }
        throw new IllegalArgumentException("Invalid image URL. Please use HTTPS URL, local path, or PNG/JPEG/WebP upload.");
    }

    /**
     * Strips HTML angle brackets from user-submitted plain-text fields (e.g., reviews).
     */
    public static String sanitizePlainText(String input) {
        if (input == null) {
            return null;
        }
        return input.replaceAll("[<>]", "").trim();
    }
}
