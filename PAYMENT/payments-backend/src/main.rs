use axum::{
    routing::{get, post},
    Router,
};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::signal;
use tower_http::trace::TraceLayer;
use dotenv::dotenv;

mod stripe_handler;
mod paypal_handler;

use stripe_handler::{create_portal_session, stripe_webhook_handler, start_checkout_basic as stripe_checkout_basic, start_checkout_premium as stripe_checkout_premium, StripeWebhookState};
use paypal_handler::{paypal_webhook_handler, start_checkout as paypal_checkout, PayPalState};

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
        .route("/checkout/basic", get(stripe_checkout_basic))   // Basic plan
        .route("/checkout/premium", get(stripe_checkout_premium)) // Premium plan
        .with_state(stripe_state);

    // Build PayPal sub-router
    let paypal_router = Router::new()
        .route("/webhook", post(paypal_webhook_handler))
        .route("/checkout", get(paypal_checkout))
        .with_state(paypal_state);

    // Combine into main app
    let app = Router::new()
        .nest("/stripe", stripe_router)
        .nest("/paypal", paypal_router)
        .route("/health", get(|| async { "OK" }))
        .layer(TraceLayer::new_for_http());

    // Get port from env or default to 3000
    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let addr: SocketAddr = format!("0.0.0.0:{}", port).parse().expect("Invalid address");

    println!("🚀 Server listening on {}", addr);
    println!("   - Stripe Handler: http://{}/stripe/webhook", addr);
    println!("   - PayPal Handler: http://{}/paypal/webhook", addr);
    println!("   - Health Check:   http://{}/health", addr);

    // Start server
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

    println!("SIGTERM received, shutting down gracefully");
}
