# Use the official Rust image as a builder
FROM rust:1.76 as builder

# Create a new empty shell project
WORKDIR /usr/src/app
COPY . .

# Build the application
RUN cargo install --path .

# Use a minimal runtime image
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/local/cargo/bin/main /usr/local/bin/qantum-payments-backend
COPY .env .env 

# Set the startup command
CMD ["qantum-payments-backend"]
