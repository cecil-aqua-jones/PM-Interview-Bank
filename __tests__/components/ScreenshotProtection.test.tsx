/**
 * Screenshot Protection Component Test Suite
 * 
 * Tests the screenshot prevention features including
 * blur on focus loss, keyboard shortcut detection, and watermarking.
 */

import { render, screen, fireEvent, act } from "@testing-library/react";
import ScreenshotProtection from "@/components/ScreenshotProtection";

describe("ScreenshotProtection", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Rendering", () => {
    it("should render children when enabled", () => {
      render(
        <ScreenshotProtection enabled={true}>
          <div data-testid="protected-content">Sensitive Content</div>
        </ScreenshotProtection>
      );
      
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
      expect(screen.getByText("Sensitive Content")).toBeInTheDocument();
    });

    it("should render children when disabled", () => {
      render(
        <ScreenshotProtection enabled={false}>
          <div data-testid="unprotected-content">Public Content</div>
        </ScreenshotProtection>
      );
      
      expect(screen.getByTestId("unprotected-content")).toBeInTheDocument();
    });

    it("should render watermark when provided", () => {
      render(
        <ScreenshotProtection enabled={true} watermark="Confidential">
          <div>Content</div>
        </ScreenshotProtection>
      );
      
      // Watermark should be rendered multiple times
      const watermarks = screen.getAllByText("Confidential");
      expect(watermarks.length).toBeGreaterThan(1);
    });

    it("should not render watermark when not provided", () => {
      render(
        <ScreenshotProtection enabled={true}>
          <div>Content</div>
        </ScreenshotProtection>
      );
      
      expect(screen.queryByText("Confidential")).not.toBeInTheDocument();
    });
  });

  describe("Focus/Blur Behavior", () => {
    it("should blur content when window loses focus", () => {
      render(
        <ScreenshotProtection enabled={true} blurOnInactive={true}>
          <div data-testid="content">Sensitive Data</div>
        </ScreenshotProtection>
      );
      
      // Trigger blur event
      act(() => {
        fireEvent.blur(window);
      });
      
      const content = document.querySelector(".screenshot-protected-content");
      expect(content).toHaveClass("blurred");
    });

    it("should unblur content when window regains focus", () => {
      render(
        <ScreenshotProtection enabled={true} blurOnInactive={true}>
          <div data-testid="content">Sensitive Data</div>
        </ScreenshotProtection>
      );
      
      // Blur then focus
      act(() => {
        fireEvent.blur(window);
      });
      
      act(() => {
        fireEvent.focus(window);
        jest.advanceTimersByTime(500); // Wait for delay
      });
      
      const content = document.querySelector(".screenshot-protected-content");
      expect(content).not.toHaveClass("blurred");
    });

    it("should not blur when blurOnInactive is false", () => {
      render(
        <ScreenshotProtection enabled={true} blurOnInactive={false}>
          <div data-testid="content">Content</div>
        </ScreenshotProtection>
      );
      
      act(() => {
        fireEvent.blur(window);
      });
      
      const content = document.querySelector(".screenshot-protected-content");
      expect(content).not.toHaveClass("blurred");
    });
  });

  describe("Keyboard Shortcut Detection", () => {
    it("should show warning on Print Screen key press", () => {
      render(
        <ScreenshotProtection enabled={true}>
          <div>Content</div>
        </ScreenshotProtection>
      );
      
      act(() => {
        fireEvent.keyDown(document, { key: "PrintScreen" });
      });
      
      expect(screen.getByText("Screenshots are not allowed")).toBeInTheDocument();
    });

    it("should hide warning after timeout", () => {
      render(
        <ScreenshotProtection enabled={true}>
          <div>Content</div>
        </ScreenshotProtection>
      );
      
      act(() => {
        fireEvent.keyDown(document, { key: "PrintScreen" });
      });
      
      expect(screen.getByText("Screenshots are not allowed")).toBeInTheDocument();
      
      act(() => {
        jest.advanceTimersByTime(2500);
      });
      
      expect(screen.queryByText("Screenshots are not allowed")).not.toBeInTheDocument();
    });

    it("should prevent Ctrl+P (print) shortcut", () => {
      render(
        <ScreenshotProtection enabled={true}>
          <div>Content</div>
        </ScreenshotProtection>
      );
      
      const event = new KeyboardEvent("keydown", {
        key: "p",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      
      const preventDefaultSpy = jest.spyOn(event, "preventDefault");
      
      act(() => {
        document.dispatchEvent(event);
      });
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("should detect Mac screenshot shortcuts (Cmd+Shift+3/4)", () => {
      render(
        <ScreenshotProtection enabled={true}>
          <div>Content</div>
        </ScreenshotProtection>
      );
      
      act(() => {
        fireEvent.keyDown(document, {
          key: "3",
          metaKey: true,
          shiftKey: true,
        });
      });
      
      expect(screen.getByText("Screenshots are not allowed")).toBeInTheDocument();
    });
  });

  describe("Context Menu Prevention", () => {
    it("should prevent right-click context menu", () => {
      render(
        <ScreenshotProtection enabled={true}>
          <div data-testid="content">Content</div>
        </ScreenshotProtection>
      );
      
      const event = new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
      });
      
      const preventDefaultSpy = jest.spyOn(event, "preventDefault");
      
      act(() => {
        document.dispatchEvent(event);
      });
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe("Text Selection Prevention", () => {
    it("should apply user-select: none style to content", () => {
      render(
        <ScreenshotProtection enabled={true}>
          <div data-testid="content">Content</div>
        </ScreenshotProtection>
      );
      
      const content = document.querySelector(".screenshot-protected-content");
      expect(content).toHaveStyle({ userSelect: "none" });
    });
  });

  describe("Disabled State", () => {
    it("should not apply protection when disabled", () => {
      render(
        <ScreenshotProtection enabled={false}>
          <div data-testid="content">Content</div>
        </ScreenshotProtection>
      );
      
      // Should render children directly without wrapper
      expect(document.querySelector(".screenshot-protection-wrapper")).not.toBeInTheDocument();
    });

    it("should not show warning when disabled", () => {
      render(
        <ScreenshotProtection enabled={false}>
          <div>Content</div>
        </ScreenshotProtection>
      );
      
      act(() => {
        fireEvent.keyDown(document, { key: "PrintScreen" });
      });
      
      expect(screen.queryByText("Screenshots are not allowed")).not.toBeInTheDocument();
    });
  });

  describe("Visibility Change Detection", () => {
    it("should blur when tab becomes hidden", () => {
      render(
        <ScreenshotProtection enabled={true} blurOnInactive={true}>
          <div>Content</div>
        </ScreenshotProtection>
      );
      
      // Mock document.hidden
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => true,
      });
      
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });
      
      const content = document.querySelector(".screenshot-protected-content");
      expect(content).toHaveClass("blurred");
      
      // Reset
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => false,
      });
    });
  });

  describe("Accessibility", () => {
    it("should mark watermark as aria-hidden", () => {
      render(
        <ScreenshotProtection enabled={true} watermark="Confidential">
          <div>Content</div>
        </ScreenshotProtection>
      );
      
      const watermarkContainer = document.querySelector(".screenshot-watermark");
      expect(watermarkContainer).toHaveAttribute("aria-hidden", "true");
    });
  });
});
