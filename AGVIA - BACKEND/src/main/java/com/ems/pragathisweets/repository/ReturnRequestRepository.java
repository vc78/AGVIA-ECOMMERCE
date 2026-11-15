package com.ems.pragathisweets.repository;

import com.ems.pragathisweets.entity.ReturnRequest;
import com.ems.pragathisweets.entity.ReturnStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {

    List<ReturnRequest> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<ReturnRequest> findByOrderIdOrderByCreatedAtDesc(Long orderId);

    Optional<ReturnRequest> findByReturnNumber(String returnNumber);

    boolean existsByOrderIdAndStatusNotIn(Long orderId, Collection<ReturnStatus> excludedStatuses);

    Page<ReturnRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<ReturnRequest> findByStatusOrderByCreatedAtDesc(ReturnStatus status, Pageable pageable);

    long countByStatus(ReturnStatus status);
}
