# ═══════════════════════════════════════════════════════════════════════════════
# QANTUM PAYMENT BACKEND — DOCKERFILE v2.0.0
# ARCHITECT: QANTUM AETERNA | STATUS: PRODUCTION_READY
# Multi-stage build for minimal attack surface
# ═══════════════════════════════════════════════════════════════════════════════

# -- BUILD STAGE --
FROM rust:1.75-bookworm AS builder

WORKDIR /app

# Copy manifests first for dependency caching
COPY Cargo.toml Cargo.lock* ./

# Create dummy src to build dependencies (cache layer)
RUN mkdir src && echo "fn main() {}" > src/main.rs && \
    cargo build --release 2>/dev/null || true

# Copy actual source code
COPY src/ src/

# Build for release
RUN cargo build --release --bin main

# -- RUNTIME STAGE --
FROM debian:bookworm-slim

WORKDIR /app

# Install necessary runtime dependencies (SSL, Certs)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libssl-dev ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy the binary from builder (binary name is 'main' per Cargo.toml [[bin]])
COPY --from=builder /app/target/release/main ./qantum-payment-backend

# Environment variables
ENV RUST_LOG=info
ENV PORT=8080

# Non-root user for security
RUN useradd -m appuser
USER appuser

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Execute
CMD ["./qantum-payment-backend"]
