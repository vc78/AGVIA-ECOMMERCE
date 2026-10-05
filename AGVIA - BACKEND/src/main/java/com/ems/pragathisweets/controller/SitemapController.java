package com.ems.pragathisweets.controller;

import com.ems.pragathisweets.entity.Category;
import com.ems.pragathisweets.entity.Product;
import com.ems.pragathisweets.repository.CategoryRepository;
import com.ems.pragathisweets.repository.ProductRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
@Tag(name = "SEO - Dynamic XML Sitemap", description = "Authoritative search engine indexing feed")
public class SitemapController {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    private static final String DOMAIN = "https://agviaboutique.com";
    private static final String DATE_TODAY = LocalDate.now().format(DateTimeFormatter.ISO_DATE);

    @GetMapping(value = "/api/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    @Operation(summary = "Generate dynamic, production-ready XML sitemap from real-time database entities")
    public ResponseEntity<String> generateDynamicSitemap() {
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        // 1. Primary Commercial Hubs
        appendUrl(xml, DOMAIN + "/", "daily", "1.0", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/products", "daily", "0.9", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/categories", "weekly", "0.8", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/offers", "daily", "0.8", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/subscription", "weekly", "0.7", DATE_TODAY);

        // 2. Editorial Collections & Bespoke Offerings
        appendUrl(xml, DOMAIN + "/gift-boxes", "weekly", "0.7", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/wedding-orders", "weekly", "0.8", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/corporate-orders", "weekly", "0.7", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/bulk-orders", "weekly", "0.7", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/styling", "monthly", "0.7", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/appointments", "monthly", "0.7", DATE_TODAY);

        // 3. Brand Story & Craftsmanship
        appendUrl(xml, DOMAIN + "/about", "monthly", "0.8", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/craftsmanship", "monthly", "0.7", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/sustainability", "monthly", "0.7", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/store-locations", "monthly", "0.7", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/blogs", "weekly", "0.7", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/careers", "monthly", "0.5", DATE_TODAY);

        // 4. Client Services & Guides
        appendUrl(xml, DOMAIN + "/contact", "monthly", "0.7", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/faq", "weekly", "0.6", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/size-guide", "monthly", "0.6", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/product-care", "monthly", "0.6", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/track-order", "daily", "0.6", DATE_TODAY);

        // 5. Legal & Policies
        appendUrl(xml, DOMAIN + "/shipping-policy", "monthly", "0.5", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/refund-policy", "monthly", "0.5", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/cancellation-policy", "monthly", "0.5", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/return-exchange-policy", "monthly", "0.5", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/privacy-policy", "monthly", "0.5", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/terms", "monthly", "0.5", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/cookie-policy", "monthly", "0.4", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/intellectual-property", "monthly", "0.4", DATE_TODAY);
        appendUrl(xml, DOMAIN + "/disclaimer", "monthly", "0.4", DATE_TODAY);

        // 6. Dynamic Categories from Database
        try {
            List<Category> categories = categoryRepository.findByActiveTrue();
            for (Category cat : categories) {
                if (cat.getName() != null && !cat.getName().isBlank()) {
                    String slug = cat.getName().toLowerCase().replace(" ", "-").replace("&", "and");
                    appendUrl(xml, DOMAIN + "/collections/" + slug, "weekly", "0.8", DATE_TODAY);
                }
            }
        } catch (Exception ex) {
            log.warn("[SitemapController] Could not append categories: {}", ex.getMessage());
        }

        // 7. Dynamic Products from Database
        try {
            List<Product> products = productRepository.findByActiveTrue();
            for (Product p : products) {
                String lastmod = p.getUpdatedAt() != null
                        ? p.getUpdatedAt().toLocalDate().format(DateTimeFormatter.ISO_DATE)
                        : (p.getCreatedAt() != null ? p.getCreatedAt().toLocalDate().format(DateTimeFormatter.ISO_DATE) : DATE_TODAY);

                appendUrl(xml, DOMAIN + "/products/" + p.getId(), "daily", "0.9", lastmod);
            }
        } catch (Exception ex) {
            log.warn("[SitemapController] Could not append products: {}", ex.getMessage());
        }

        xml.append("</urlset>");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_XML);
        headers.setCacheControl("public, max-age=3600"); // Cache sitemap for 1 hour

        return new ResponseEntity<>(xml.toString(), headers, HttpStatus.OK);
    }

    private void appendUrl(StringBuilder sb, String loc, String freq, String priority, String lastmod) {
        sb.append("  <url>\n");
        sb.append("    <loc>").append(escapeXml(loc)).append("</loc>\n");
        if (lastmod != null) {
            sb.append("    <lastmod>").append(lastmod).append("</lastmod>\n");
        }
        sb.append("    <changefreq>").append(freq).append("</changefreq>\n");
        sb.append("    <priority>").append(priority).append("</priority>\n");
        sb.append("  </url>\n");
    }

    private String escapeXml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}
