package com.ems.pragathisweets.config;

import com.razorpay.RazorpayClient;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class RazorpayConfig {

    @Value("${razorpay.key-id:}")
    private String keyId;

    @Value("${razorpay.key-secret:}")
    private String keySecret;

    @Value("${razorpay.webhook-secret:}")
    private String webhookSecret;

    @Bean
    public RazorpayClient razorpayClient() throws Exception {
        String id = keyId != null ? keyId : "";
        String secret = keySecret != null ? keySecret : "";
        return new RazorpayClient(id, secret);
    }
}
