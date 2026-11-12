# =============================================================================
# AGVIA Boutique Backend - Production Dockerfile (Monorepo Root Context)
# Allows building directly from repository root on Render, Railway, or local Docker
# =============================================================================

# Stage 1: Build application using Maven
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /workspace

# Copy POM and dependencies first from AGVIA - BACKEND
COPY ["AGVIA - BACKEND/pom.xml", "./pom.xml"]
RUN mvn dependency:go-offline -B

# Copy source code and package
COPY ["AGVIA - BACKEND/src", "./src"]
RUN mvn clean package -DskipTests -B

# Stage 2: Minimal hardened JRE runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create a non-root system group and user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy compiled jar from builder stage
COPY --from=builder /workspace/target/*.jar app.jar
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose HTTP port
EXPOSE 8080

# Configure JVM flags for container environments
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

# Healthcheck targeting the dedicated /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/api/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

