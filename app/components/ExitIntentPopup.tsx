"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "apex_exit_popup_shown";
const STORAGE_SUBSCRIBED_KEY = "apex_subscribed";

export default function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Check if already shown or subscribed
  const shouldShowPopup = useCallback(() => {
    if (typeof window === "undefined") return false;
    const alreadyShown = localStorage.getItem(STORAGE_KEY);
    const alreadySubscribed = localStorage.getItem(STORAGE_SUBSCRIBED_KEY);
    return !alreadyShown && !alreadySubscribed;
  }, []);

  // Exit intent detection
  useEffect(() => {
    if (!shouldShowPopup()) return;

    let hasTriggered = false;

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse moves toward top of viewport (browser chrome)
      if (e.clientY <= 10 && !hasTriggered) {
        hasTriggered = true;
        setIsVisible(true);
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
      }
    };

    // Small delay before attaching listener to avoid immediate trigger
    const timeout = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 3000);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [shouldShowPopup]);

  // Prevent body scroll when popup is open
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setErrorMessage("Please enter your email");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim(),
          firstName: firstName.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setStatus("success");
      localStorage.setItem(STORAGE_SUBSCRIBED_KEY, "true");
      
      // Close popup after showing success message
      setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  if (!isVisible) return null;

  return (
    <div className="exit-popup-overlay" onClick={handleClose}>
      <div className="exit-popup-modal" onClick={(e) => e.stopPropagation()}>
        <button className="exit-popup-close" onClick={handleClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {status === "success" ? (
          <div className="exit-popup-success">
            <div className="exit-popup-success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="exit-popup-success-title">Check your inbox!</h2>
            <p className="exit-popup-success-text">
              Your exclusive 20% discount code is on its way. The offer expires in 7 days.
            </p>
          </div>
        ) : (
          <>
            <div className="exit-popup-badge">Limited Time Offer</div>
            
            <h2 className="exit-popup-title">
              Wait! Get 20% Off Before You Go
            </h2>
            
            <p className="exit-popup-subtitle">
              Join 500+ engineers who've used Apex Interviewer to land roles at Google, Meta, Amazon, and OpenAI.
            </p>

            <div className="exit-popup-pricing">
              <div className="exit-popup-price-item">
                <span className="exit-popup-price-label">Annual</span>
                <span className="exit-popup-price-original">$500</span>
                <span className="exit-popup-price-discount">$400</span>
              </div>
              <div className="exit-popup-price-divider"></div>
              <div className="exit-popup-price-item">
                <span className="exit-popup-price-label">Monthly</span>
                <span className="exit-popup-price-original">$75</span>
                <span className="exit-popup-price-discount">$55</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="exit-popup-form">
              <div className="exit-popup-inputs">
                <input
                  type="text"
                  placeholder="First name (optional)"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="exit-popup-input"
                  disabled={status === "loading"}
                />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="exit-popup-input"
                  required
                  disabled={status === "loading"}
                />
              </div>
              
              {status === "error" && errorMessage && (
                <p className="exit-popup-error">{errorMessage}</p>
              )}
              
              <button 
                type="submit" 
                className="exit-popup-submit"
                disabled={status === "loading"}
              >
                {status === "loading" ? "Sending..." : "Send My Discount Code"}
              </button>
            </form>

            <p className="exit-popup-disclaimer">
              No spam. Unsubscribe anytime. Offer valid for 7 days.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
