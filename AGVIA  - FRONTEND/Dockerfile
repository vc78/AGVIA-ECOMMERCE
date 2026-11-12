# Stage 1: Build React/Vite frontend
FROM node:20-alpine AS builder
WORKDIR /app

# Build arguments for Vite environment variables
ARG VITE_API_BASE_URL=https://agvia.onrender.com/api
ARG VITE_API_URL=https://agvia.onrender.com/api
ARG VITE_RAZORPAY_KEY_ID=rzp_test_TDnNEoRLz2m96G

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID

# Install dependencies first for efficient caching
COPY package*.json ./
RUN npm ci

# Copy sources and build
COPY . .
RUN npm run build

# Stage 2: Serve with lightweight Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy built assets from builder stage
COPY --from=builder /app/dist .

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
