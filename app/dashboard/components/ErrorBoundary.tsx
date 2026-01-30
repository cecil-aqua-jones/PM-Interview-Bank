"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary component to catch and handle React errors gracefully.
 * Prevents a crash in one component from taking down the entire dashboard.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "3rem",
            textAlign: "center",
            minHeight: "300px",
            background: "rgba(0, 0, 0, 0.02)",
            borderRadius: "8px",
            border: "1px solid rgba(0, 0, 0, 0.06)",
          }}
        >
          <h2
            style={{
              margin: "0 0 1rem",
              fontSize: "1.25rem",
              fontWeight: 500,
              color: "#1a1a1a",
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              margin: "0 0 1.5rem",
              color: "#6b7280",
              fontSize: "0.875rem",
              maxWidth: "400px",
            }}
          >
            We encountered an unexpected error. Please try again or refresh the page.
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#fff",
              background: "#1a1a1a",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "opacity 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
