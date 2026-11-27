package com.ems.pragathisweets.event;

import com.ems.pragathisweets.service.admin.ExcelReportingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Transactional event listener for AGVIA_ORDERS.xlsx synchronization.
 * 
 * ZERO ROLLBACK GUARANTEE:
 * - Runs ONLY AFTER the MySQL transaction has committed (TransactionPhase.AFTER_COMMIT).
 * - Runs asynchronously in background (@Async).
 * - Any exception in file I/O or Apache POI is caught and logged; the MySQL order is NEVER rolled back.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderExcelEventListener {

    private final ExcelReportingService excelReportingService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onOrderConfirmed(OrderConfirmedEvent event) {
        log.info("[OrderExcelEventListener] Received order confirmed event for orderId={}, orderNumber={}, source={}. Syncing to AGVIA_ORDERS.xlsx...",
                event.getOrderId(), event.getOrderNumber(), event.getSource());
        try {
            excelReportingService.syncOrder(event.getOrderId());
        } catch (Throwable t) {
            // Absolute failure isolation: order remains committed in MySQL
            log.error("[OrderExcelEventListener] Unexpected error syncing order #{} to Excel report: {}",
                    event.getOrderNumber(), t.getMessage(), t);
        }
    }
}
