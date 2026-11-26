package com.ems.pragathisweets.controller;

import com.ems.pragathisweets.config.CorsConfig;
import com.ems.pragathisweets.config.SecurityConfig;
import com.ems.pragathisweets.controller.admin.AdminUserController;
import com.ems.pragathisweets.repository.UserRepository;
import com.ems.pragathisweets.security.JwtAuthenticationFilter;
import com.ems.pragathisweets.security.JwtService;
import com.ems.pragathisweets.service.AuthService;
import com.ems.pragathisweets.service.GoogleAuthService;
import com.ems.pragathisweets.service.OrderService;
import com.ems.pragathisweets.service.PaymentService;
import com.ems.pragathisweets.service.SubscriptionService;
import com.ems.pragathisweets.service.admin.AdminService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {
        AuthController.class,
        AdminUserController.class,
        PaymentController.class,
        OrderController.class,
        SubscriptionController.class
})
@Import({SecurityConfig.class, CorsConfig.class, JwtAuthenticationFilter.class})
class SecurityEndpointAuthorizationTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private UserDetailsService userDetailsService;
    @MockitoBean private JwtService jwtService;
    @MockitoBean private AuthService authService;
    @MockitoBean private GoogleAuthService googleAuthService;
    @MockitoBean private UserRepository userRepository;
    @MockitoBean private AdminService adminService;
    @MockitoBean private PaymentService paymentService;
    @MockitoBean private OrderService orderService;
    @MockitoBean private SubscriptionService subscriptionService;

    @Test
    @DisplayName("Removed OTP auth routes are no longer accessible")
    void testOtpRoutesRemoved() throws Exception {
        mockMvc.perform(post("/api/auth/signup/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Protected payment, admin, tracking, and subscription routes block unauthenticated requests and enforce RBAC")
    void testUnauthorizedAndPrivilegeEscalationBlocked() throws Exception {
        mockMvc.perform(get("/api/admin/users")).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/payments/razorpay/create/LLW-1")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/orders/track/LLW-1")).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/subscriptions/activate-instant")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"x@example.com\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "customer@example.com", roles = {"USER"})
    @DisplayName("ROLE_USER cannot access /api/admin/** or /api/subscriptions/activate-instant (Privilege escalation blocked)")
    void testCustomerBlockedFromAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/admin/users")).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/subscriptions/activate-instant")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"x@example.com\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Security response headers (CSP, X-Frame-Options, nosniff, Referrer-Policy) are emitted")
    void testSecurityHeadersPresent() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"user@example.com\"}"))
                .andExpect(status().isOk())
                .andExpect(header().exists("Content-Security-Policy"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("Referrer-Policy", "strict-origin-when-cross-origin"));
    }
}
