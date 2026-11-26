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
                "You are writing a clear, accurate, customer-friendly handloom saree product description for Lokesh Lingam Weaver in Dharmavaram, Andhra Pradesh.\n" +
                "Write a helpful description for:\n" +
                "Product Name: %s\n" +
                "Category: %s\n" +
                "Fabric / Weave Details: %s\n" +
                "Unit: %s\n" +
                "Price: %s\n" +
                "Notes: %s\n\n" +
                "Respond ONLY with valid JSON having exact keys: description, shortDescription, suggestedCategory, tags (array of strings), highlights (array of strings), seoDescription. " +
                "Do NOT invent certifications (like Silk Mark), awards, or unverified shipping guarantees.",
                request.getName(),
                request.getCategory() != null ? request.getCategory() : "Dharmavaram Silk Sarees",
                request.getIngredients() != null ? request.getIngredients() : "Handloom Silk Weave",
                request.getWeight() != null ? request.getWeight() : "piece",
                request.getPrice() != null ? request.getPrice() : "",
                request.getCharacteristics() != null ? request.getCharacteristics() : "Traditional Dharmavaram weaving heritage"
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
        String name = request.getName() != null && !request.getName().isBlank() ? request.getName() : "Handloom Saree";
        String cat = request.getCategory() != null && !request.getCategory().isBlank() ? request.getCategory() : "Dharmavaram Silk Sarees";
        
        String desc = String.format(
                "%s from Lokesh Lingam Weaver in Dharmavaram, Andhra Pradesh.\n\n" +
                "Crafted with dedication, heritage, and 15 years of weaving experience, bringing handloom sarees directly from our looms to your hands.\n\n" +
                "For colour options, border details, or ordering enquiries, contact us on WhatsApp at +91 7799349294.",
                name
        );

        String shortDesc = String.format("%s from Lokesh Lingam Weaver, Dharmavaram.", name);
        String seo = String.format("Explore %s from Lokesh Lingam Weaver — Dharmavaram handloom sarees.", name);

        return AiProductGenerateResponse.builder()
                .name(name)
                .description(desc)
                .shortDescription(shortDesc)
                .suggestedCategory(cat)
                .tags(List.of("Dharmavaram Handloom", "Lokesh Lingam Weaver", "Traditional Weaves"))
                .highlights(List.of("Direct Handloom Weaver", "Dharmavaram Weaving Heritage"))
                .seoDescription(seo)
                .build();
    }
}
