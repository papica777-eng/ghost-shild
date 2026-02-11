// ═══════════════════════════════════════════════════════════════════════════════
// QANTUM PAYMENT BACKEND — MAIN ENTRY v2.0.0
// ARCHITECT: QANTUM AETERNA | STATUS: PRODUCTION_READY
// Axum Server with Production CORS, Stripe + PayPal Routers
// ═══════════════════════════════════════════════════════════════════════════════

use axum::{
    routing::{get, post},
    Router,
};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::signal;
use tower_http::cors::{AllowHeaders, AllowMethods, CorsLayer};
use tower_http::trace::TraceLayer;
use dotenv::dotenv;
use http::{HeaderValue, Method};

mod stripe_handler;
mod paypal_handler;

use stripe_handler::{
    create_portal_session,
    stripe_webhook_handler,
    start_checkout_basic as stripe_checkout_basic,
    start_checkout_premium as stripe_checkout_premium,
    verify_session as stripe_verify_session,
    health_check as stripe_health_check,
    StripeWebhookState,
};
use paypal_handler::{
    paypal_webhook_handler,
    start_checkout as paypal_checkout,
    capture_order as paypal_capture,
    PayPalState,
};

/// O(1) — Build production CORS layer from DOMAIN env
fn build_cors_layer() -> CorsLayer {
    let domain = std::env::var("DOMAIN")
        .unwrap_or_else(|_| "https://veritas.website".to_string());

    // Parse allowed origins: main domain + common dev origins
    let mut origins: Vec<HeaderValue> = Vec::new();

    // Primary domain
    if let Ok(val) = domain.parse::<HeaderValue>() {
        origins.push(val);
    }

    // Additional allowed origins from env (comma-separated)
    if let Ok(extra) = std::env::var("CORS_ALLOWED_ORIGINS") {
        for origin in extra.split(',') {
            let trimmed = origin.trim();
            if let Ok(val) = trimmed.parse::<HeaderValue>() {
                origins.push(val);
            }
        }
    }

    // Always allow localhost for development
    if let Ok(val) = "http://localhost:3000".parse::<HeaderValue>() {
        origins.push(val);
    }
    if let Ok(val) = "http://localhost:5173".parse::<HeaderValue>() {
        origins.push(val);
    }
    if let Ok(val) = "http://127.0.0.1:3000".parse::<HeaderValue>() {
        origins.push(val);
    }

    println!("[CORS] 🔒 Allowed origins: {:?}", origins);

    CorsLayer::new()
        .allow_origin(origins)
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::OPTIONS,
        ])
        .allow_headers(AllowHeaders::any())
        .max_age(std::time::Duration::from_secs(3600))
}

#[tokio::main]
async fn main() {
    // Load environment variables from .env if available
    dotenv().ok();

    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Load states
    let stripe_state = Arc::new(StripeWebhookState::new());
    let paypal_state = Arc::new(PayPalState::new());

    // Build Stripe sub-router
    let stripe_router = Router::new()
        .route("/webhook", post(stripe_webhook_handler))
        .route("/portal", post(create_portal_session))
        .route("/checkout/basic", get(stripe_checkout_basic))
        .route("/checkout/premium", get(stripe_checkout_premium))
        .route("/verify", get(stripe_verify_session))
        .route("/health", get(stripe_health_check))
        .with_state(stripe_state);

    // Build PayPal sub-router
    let paypal_router = Router::new()
        .route("/webhook", post(paypal_webhook_handler))
        .route("/checkout", get(paypal_checkout))
        .route("/capture", get(paypal_capture))
        .with_state(paypal_state);

    // Build CORS layer
    let cors = build_cors_layer();

    // Combine into main app
    let app = Router::new()
        .nest("/stripe", stripe_router)
        .nest("/paypal", paypal_router)
        .route("/health", get(|| async {
            serde_json::json!({
                "status": "OK",
                "version": "2.0.0",
                "provider": "QANTUM_AETERNA",
                "timestamp": chrono::Utc::now().to_rfc3339(),
            }).to_string()
        }))
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    // Get port from env or default to 3000
    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let addr: SocketAddr = format!("0.0.0.0:{}", port).parse().expect("Invalid address");

    println!("═══════════════════════════════════════════════════════════════");
    println!("  QANTUM PAYMENT BACKEND v2.0.0 — PRODUCTION READY");
    println!("═══════════════════════════════════════════════════════════════");
    println!("  🚀 Server listening on {}", addr);
    println!("  ─────────────────────────────────────────────────────────────");
    println!("  STRIPE ROUTES:");
    println!("    POST /stripe/webhook          — Webhook handler");
    println!("    POST /stripe/portal           — Customer portal");
    println!("    GET  /stripe/checkout/basic    — Basic checkout");
    println!("    GET  /stripe/checkout/premium  — Premium checkout");
    println!("    GET  /stripe/verify            — Session verification");
    println!("    GET  /stripe/health            — Stripe health check");
    println!("  ─────────────────────────────────────────────────────────────");
    println!("  PAYPAL ROUTES:");
    println!("    POST /paypal/webhook           — Webhook handler");
    println!("    GET  /paypal/checkout           — Create order");
    println!("    GET  /paypal/capture            — Capture order");
    println!("  ─────────────────────────────────────────────────────────────");
    println!("    GET  /health                    — System health");
    println!("═══════════════════════════════════════════════════════════════");

    // Start server with graceful shutdown
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .unwrap();
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    println!("[SHUTDOWN] ⚡ SIGTERM received, shutting down gracefully");
}
