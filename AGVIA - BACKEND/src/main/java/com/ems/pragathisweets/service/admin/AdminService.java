package com.ems.pragathisweets.service.admin;

import com.ems.pragathisweets.dto.UserResponse;
import com.ems.pragathisweets.dto.admin.UserRoleUpdateRequest;
import com.ems.pragathisweets.dto.admin.UserStatusUpdateRequest;
import com.ems.pragathisweets.entity.Role;
import com.ems.pragathisweets.entity.User;
import com.ems.pragathisweets.exception.ResourceNotFoundException;
import com.ems.pragathisweets.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        return toResponse(findEntity(id));
    }

    @Transactional
    public UserResponse updateUserRole(Long id, UserRoleUpdateRequest request) {
        User user = findEntity(id);
        try {
            user.setRole(Role.valueOf(request.getRole().toUpperCase()));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid role. Use ROLE_USER or ROLE_ADMIN");
        }
        user.incrementTokenVersion();
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateUserStatus(Long id, UserStatusUpdateRequest request) {
        User user = findEntity(id);
        user.setEnabled(request.getEnabled());
        user.incrementTokenVersion();
        return toResponse(userRepository.save(user));
    }

    private User findEntity(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .address(user.getAddress())
                .role(user.getRole().name())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
