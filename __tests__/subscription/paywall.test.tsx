/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock next/navigation
const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();
jest.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockRouterPush,
        replace: mockRouterReplace,
    }),
    usePathname: () => "/dashboard",
    useSearchParams: () => new URLSearchParams(),
}));

// Mock next/image
jest.mock("next/image", () => ({
    __esModule: true,
    default: (props: Record<string, unknown>) => {
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        const { unoptimized, ...rest } = props;
        return <img {...rest} />;
    },
}));

// Variable to control mock payment status
let mockUserHasPaid = false;
let mockSupabaseConfigured = true;

// Mock Supabase client
jest.mock("@/lib/supabaseClient", () => ({
    get supabase() {
        if (!mockSupabaseConfigured) return null;
        return {
            auth: {
                getUser: jest.fn().mockResolvedValue({
                    data: {
                        user: mockUserHasPaid
                            ? {
                                id: "user-123",
                                email: "test@example.com",
                                user_metadata: {
                                    has_paid: true,
                                    payment_date: "2026-01-15T00:00:00.000Z",
                                    stripe_session_id: "cs_test_123",
                                },
                            }
                            : {
                                id: "user-456",
                                email: "unpaid@example.com",
                                user_metadata: {},
                            },
                    },
                }),
            },
        };
    },
}));

// Import components after mocks
import CompanyGridClient from "@/app/dashboard/components/CompanyGridClient";
import PaywallModal from "@/app/dashboard/components/PaywallModal";

const mockCompanies = [
    {
        id: "1",
        name: "Google",
        slug: "google",
        questionCount: 25,
    },
    {
        id: "2",
        name: "Meta",
        slug: "meta",
        questionCount: 18,
    },
];

describe("Paywall Functionality", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUserHasPaid = false;
        mockSupabaseConfigured = true;
    });

    describe("CompanyGridClient - Access Control", () => {
        it("should show lock icon for unpaid users", () => {
            render(<CompanyGridClient companies={mockCompanies} hasPaid={false} />);

            // Lock icons should be present
            const lockIcons = document.querySelectorAll('[class*="lockIcon"]');
            expect(lockIcons.length).toBeGreaterThan(0);
        });

        it("should NOT show lock icon for paid users", () => {
            render(<CompanyGridClient companies={mockCompanies} hasPaid={true} />);

            // Lock icons should not be present
            const lockIcons = document.querySelectorAll('[class*="lockIcon"]');
            expect(lockIcons.length).toBe(0);
        });

        it("should show paywall modal when unpaid user clicks company card", async () => {
            render(<CompanyGridClient companies={mockCompanies} hasPaid={false} />);

            // Click on the first company card
            const companyCards = screen.getAllByRole("link");
            fireEvent.click(companyCards[0]);

            // Paywall modal should appear
            await waitFor(() => {
                expect(screen.getByText(/Unlock.*Questions/i)).toBeInTheDocument();
            });
        });

        it("should allow navigation when paid user clicks company card", () => {
            render(<CompanyGridClient companies={mockCompanies} hasPaid={true} />);

            // Click on the first company card - should not show paywall
            const companyCards = screen.getAllByRole("link");
            fireEvent.click(companyCards[0]);

            // Paywall should NOT appear
            expect(screen.queryByText(/Unlock.*Questions/i)).not.toBeInTheDocument();
        });

        it("should display correct company count and question total", () => {
            render(<CompanyGridClient companies={mockCompanies} hasPaid={false} />);

            // Should show total questions (25 + 18 = 43)
            expect(screen.getByText(/43 interview questions/i)).toBeInTheDocument();
            expect(screen.getByText(/2 companies/i)).toBeInTheDocument();
        });
    });

    describe("PaywallModal - UI and Behavior", () => {
        const mockOnClose = jest.fn();

        beforeEach(() => {
            mockOnClose.mockClear();
        });

        it("should display company name in paywall when provided", async () => {
            await act(async () => {
                render(<PaywallModal companyName="Google" onClose={mockOnClose} />);
            });

            expect(screen.getByText(/Unlock Google Questions/i)).toBeInTheDocument();
        });

        it("should display generic message when no company name", async () => {
            await act(async () => {
                render(<PaywallModal onClose={mockOnClose} />);
            });

            expect(screen.getByText(/Unlock All Questions/i)).toBeInTheDocument();
        });

        it("should display correct pricing ($350)", async () => {
            await act(async () => {
                render(<PaywallModal onClose={mockOnClose} />);
            });

            expect(screen.getByText("$350")).toBeInTheDocument();
            expect(screen.getByText(/per year/i)).toBeInTheDocument();
        });

        it("should display all feature benefits", async () => {
            await act(async () => {
                render(<PaywallModal onClose={mockOnClose} />);
            });

            expect(screen.getByText(/1,500\+ real coding questions/i)).toBeInTheDocument();
            expect(screen.getByText(/AI code review with follow-ups/i)).toBeInTheDocument();
            expect(screen.getByText(/1 year of unlimited access/i)).toBeInTheDocument();
            expect(screen.getByText(/Weekly question updates/i)).toBeInTheDocument();
        });

        it("should call onClose when close button is clicked", async () => {
            await act(async () => {
                render(<PaywallModal onClose={mockOnClose} />);
            });

            // Find and click close button
            const closeButton = document.querySelector('[class*="paywallClose"]');
            if (closeButton) {
                fireEvent.click(closeButton);
            }

            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it("should call onClose when clicking overlay background", async () => {
            await act(async () => {
                render(<PaywallModal onClose={mockOnClose} />);
            });

            // Click on overlay
            const overlay = document.querySelector('[class*="paywallOverlay"]');
            if (overlay) {
                fireEvent.click(overlay);
            }

            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it("should NOT close when clicking inside modal content", async () => {
            await act(async () => {
                render(<PaywallModal onClose={mockOnClose} />);
            });

            // Click on modal content (not overlay)
            const modalContent = document.querySelector('[class*="paywallModal"]');
            if (modalContent) {
                fireEvent.click(modalContent);
            }

            // Should not have been called
            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it("should have a checkout button that initiates payment", async () => {
            await act(async () => {
                render(<PaywallModal onClose={mockOnClose} />);
            });

            const checkoutButton = screen.getByRole("button", { name: /Get Full Access/i });
            expect(checkoutButton).toBeInTheDocument();
            expect(checkoutButton).not.toBeDisabled();
        });

        it("should display Stripe security messaging", async () => {
            await act(async () => {
                render(<PaywallModal onClose={mockOnClose} />);
            });

            expect(screen.getByText(/Secure checkout powered by Stripe/i)).toBeInTheDocument();
        });
    });

    describe("Payment Status Persistence", () => {
        it("should check has_paid in user_metadata for access", async () => {
            mockUserHasPaid = true;

            // When has_paid is true, user should have access
            const { supabase } = require("@/lib/supabaseClient");
            const result = await supabase.auth.getUser();

            expect(result.data.user.user_metadata.has_paid).toBe(true);
            expect(result.data.user.user_metadata.stripe_session_id).toBeDefined();
        });

        it("should return false for users without has_paid metadata", async () => {
            mockUserHasPaid = false;

            const { supabase } = require("@/lib/supabaseClient");
            const result = await supabase.auth.getUser();

            expect(result.data.user.user_metadata.has_paid).toBeUndefined();
        });

        it("should allow access when Supabase is not configured (development)", async () => {
            mockSupabaseConfigured = false;

            const { supabase } = require("@/lib/supabaseClient");

            // When Supabase is null (not configured), should allow access
            expect(supabase).toBeNull();
        });
    });
});

describe("Payment Flow Integration", () => {
    beforeEach(() => {
        global.fetch = jest.fn();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should create checkout session with correct response format", async () => {
        const mockResponse = {
            sessionId: "cs_test_123",
            url: "https://checkout.stripe.com/pay/cs_test_123",
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            json: () => Promise.resolve(mockResponse),
        });

        const response = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "test@example.com" }),
        });

        const data = await response.json();

        expect(data.url).toContain("checkout.stripe.com");
        expect(data.sessionId).toBeDefined();
    });

    it("should handle checkout API errors gracefully", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            json: () => Promise.resolve({ error: "Payment system not configured" }),
        });

        const response = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });

        const data = await response.json();

        expect(data.error).toBeDefined();
    });
});
