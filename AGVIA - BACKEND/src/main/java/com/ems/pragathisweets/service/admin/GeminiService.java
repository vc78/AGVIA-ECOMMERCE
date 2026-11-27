package com.ems.pragathisweets.service.admin;

import com.ems.pragathisweets.dto.admin.AiProductGenerateRequest;
import com.ems.pragathisweets.dto.admin.AiProductGenerateResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@Slf4j
public class GeminiService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String getResolvedApiKey() {
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            return apiKey.trim();
        }
        String envKey = System.getenv("GEMINI_API_KEY");
        if (envKey != null && !envKey.trim().isEmpty()) {
            return envKey.trim();
        }
        // Try reading from .env file
        try {
            java.nio.file.Path envPath = java.nio.file.Paths.get(".env");
            if (!java.nio.file.Files.exists(envPath)) {
                envPath = java.nio.file.Paths.get("AGVIA - BACKEND", ".env");
            }
            if (java.nio.file.Files.exists(envPath)) {
                for (String line : java.nio.file.Files.readAllLines(envPath)) {
                    if (line.trim().startsWith("GEMINI_API_KEY=")) {
                        return line.trim().substring("GEMINI_API_KEY=".length()).trim();
                    }
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    public AiProductGenerateResponse generateProductContent(AiProductGenerateRequest request) {
        String key = getResolvedApiKey();
        if (key != null && !key.isEmpty()) {
            try {
                return callGeminiApi(request, key);
            } catch (Exception e) {
                log.warn("Gemini API call failed, falling back to local boutique template generator: {}", e.getMessage());
            }
        }
        return generateArtisanalFallback(request);
    }

    private AiProductGenerateResponse callGeminiApi(AiProductGenerateRequest request, String key) throws Exception {
        String endpoint = apiUrl + "?key=" + key;

        String prompt = String.format(
                "You are an acclaimed haute couture stylist, master textile curator, and editorial copywriter for AGVIA Luxury Indian Women's Wear Atelier.\n" +
                "Write an authentic, opulent, and detailed couture description script for the following luxury garment:\n" +
                "Silhouette Name: %s\n" +
                "Couture Line / Category: %s\n" +
                "Fabric / Weave Details: %s\n" +
                "Unit / Ensemble: %s\n" +
                "Price: %s\n" +
                "Artisanal Notes: %s\n\n" +
                "Generate a JSON response containing an extensive, beautifully written couture story that covers:\n" +
                "1. Heritage Weave & Fabric: Details on handloom craftsmanship, pure mulberry silk/fabric density, and tactile texture.\n" +
                "2. Zari & Embellishment Artistry: Details on border motifs (e.g. temple korvai, zardozi, hand-cut mirrors, metallic zari).\n" +
                "3. Silhouette, Drape & Movement: How the garment flatters, moves, and cascades.\n" +
                "4. Bridal & Festive Styling Guide: Recommended blouse pairings, antique/kundan jewelry, dupatta styling, and footwear.\n" +
                "5. Heirloom Care: Dry clean only, muslin cloth storage, and preservation notes.\n\n" +
                "Respond ONLY with valid JSON having the exact keys: description (detailed multi-paragraph couture script with clean headings), shortDescription (concise 2-line summary), suggestedCategory, tags (array of strings), highlights (array of strings), seoDescription. " +
                "Do not include markdown backticks or explanations.",
                request.getName(),
                request.getCategory() != null ? request.getCategory() : "Sarees & Couture",
                request.getIngredients() != null ? request.getIngredients() : "Pure Mulberry Silk, Metallic Zari, Handloom Craftsmanship",
                request.getWeight() != null ? request.getWeight() : "piece",
                request.getPrice() != null ? request.getPrice() : "",
                request.getCharacteristics() != null ? request.getCharacteristics() : "Bespoke tailoring, royal bridal trousseau, artisanal embroidery"
        );

        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> payload = Map.of("contents", List.of(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(endpoint, entity, String.class);
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                String text = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
                String cleaned = text.trim();
                if (cleaned.startsWith("```json")) {
                    cleaned = cleaned.substring(7);
                } else if (cleaned.startsWith("```")) {
                    cleaned = cleaned.substring(3);
                }
                if (cleaned.endsWith("```")) {
                    cleaned = cleaned.substring(0, cleaned.length() - 3);
                }
                cleaned = cleaned.trim();

                JsonNode parsed = objectMapper.readTree(cleaned);
                List<String> tags = new ArrayList<>();
                if (parsed.has("tags") && parsed.get("tags").isArray()) {
                    parsed.get("tags").forEach(t -> tags.add(t.asText()));
                }
                List<String> highlights = new ArrayList<>();
                if (parsed.has("highlights") && parsed.get("highlights").isArray()) {
                    parsed.get("highlights").forEach(h -> highlights.add(h.asText()));
                }

                return AiProductGenerateResponse.builder()
                        .name(request.getName())
                        .description(parsed.path("description").asText())
                        .shortDescription(parsed.path("shortDescription").asText())
                        .suggestedCategory(parsed.path("suggestedCategory").asText(request.getCategory()))
                        .tags(tags)
                        .highlights(highlights)
                        .seoDescription(parsed.path("seoDescription").asText())
                        .build();
            }
        }
        return generateArtisanalFallback(request);
    }

    private AiProductGenerateResponse generateArtisanalFallback(AiProductGenerateRequest request) {
        String name = request.getName() != null && !request.getName().isBlank() ? request.getName() : "Handcrafted Silk Silhouette";
        String cat = request.getCategory() != null && !request.getCategory().isBlank() ? request.getCategory() : "Heirloom Sarees";
        
        String desc = String.format(
                "Handcrafted with royal finesse, the %s exemplifies AGVIA's devotion to timeless Indian couture.\n\n" +
                "✦ Fabric & Heritage Weave: Woven on traditional pit looms using certified pure mulberry silk threads, boasting an exquisite natural sheen and supple texture that drapes with majestic fluidity.\n\n" +
                "✦ Artistry & Borders: Features hand-interlocked temple Korvai borders, framed with rich metallic zari and intricate floral vines inspired by royal Mughal and Dravidian architectural motifs.\n\n" +
                "✦ Styling & Occasion: Designed for grand wedding trousseaus, reception galas, and festive rituals. Pair with an embroidered raw silk blouse, antique temple jewelry, and a sleek jasmine-adorned bridal coiffure.\n\n" +
                "✦ Heirloom Care: Dry clean exclusively. Preserve wrapped in pure cotton muslin in a cool, dark wardrobe to safeguard the luminous metallic zari for generations.",
                name
        );

        String shortDesc = String.format("Handwoven %s featuring pure mulberry silk and authentic zari artistry from the AGVIA Atelier.", name);
        String seo = String.format("Shop authentic handloom %s online at AGVIA Luxury Boutique. Certified pure silk with royal metallic zari and bespoke craftsmanship.", name);

        return AiProductGenerateResponse.builder()
                .name(name)
                .description(desc)
                .shortDescription(shortDesc)
                .suggestedCategory(cat)
                .tags(List.of("Pure Mulberry Silk", "Handloom Weave", "Metallic Zari", "Bridal Trousseau", "Artisanal Couture", "Silk Mark Certified"))
                .highlights(List.of("100% Certified Pure Silk", "Authentic Korvai Temple Borders", "Hand-finished Pallu Artistry", "Bespoke Keepsake Packaging"))
                .seoDescription(seo)
                .build();
    }
}
