import "./globals.css";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import { Metadata } from "next";
import Script from "next/script";
import { PostHogProvider } from "./providers/PostHogProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600"]
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "600", "700"]
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-code",
  display: "swap",
  weight: ["400", "500"]
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.apexinterviewer.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Apex Interviewer | Top Tech & AI Interview Questions with AI Practice",
    template: "%s | Apex Interviewer"
  },
  description:
    "Ace your interviews at Google, OpenAI, Meta, Anthropic, Amazon, and the world's most sought-after tech companies. Practice with an AI interviewer that reviews your code and asks follow-up questions.",
  keywords: [
    "coding interview questions",
    "top tech interview prep",
    "Google coding interview",
    "Meta coding interview",
    "Amazon coding interview",
    "OpenAI interview prep",
    "Anthropic coding interview",
    "AI company interviews",
    "TikTok coding interview",
    "LeetCode alternatives",
    "software engineer interview",
    "technical interview preparation",
    "algorithm interview questions",
    "data structures interview",
    "system design interview",
    "coding practice with AI"
  ],
  authors: [{ name: "Apex Interviewer" }],
  creator: "Apex Interviewer",
  publisher: "Apex Interviewer",
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Apex Interviewer",
    title: "Apex Interviewer | Top Tech & AI Interview Questions with AI Practice",
    description:
      "Ace your interviews at Google, OpenAI, Meta, Anthropic, Amazon, and the world's most sought-after tech companies. Practice with an AI interviewer.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Apex Interviewer - Top Tech & AI Interview Prep"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Apex Interviewer | Top Tech & AI Interview Questions with AI Practice",
    description:
      "Ace your interviews at Google, OpenAI, Meta, Anthropic, Amazon, and the world's most sought-after tech companies.",
    images: ["/og-image.png"],
    creator: "@apexinterviewer"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || "",
    yandex: process.env.YANDEX_SITE_VERIFICATION || "",
    // bing: process.env.BING_SITE_VERIFICATION || "",
  },
  alternates: {
    canonical: siteUrl
  },
  category: "Education"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a1918" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable}`}>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-KXYGZCZBCB"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-KXYGZCZBCB');
          `}
        </Script>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
