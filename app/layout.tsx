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
    default: "Apex Interviewer | AI Software Engineer Interview Coach - FAANG Prep",
    template: "%s | Apex Interviewer"
  },
  description:
    "AI-powered interview coaching for software engineers. Pass Google, Meta, Amazon, and FAANG interviews with real-time feedback on coding, system design, and behavioral questions. Stop failing technical interviews.",
  keywords: [
    // Core product keywords
    "ai interview coach software engineer",
    "ai mock interview platform",
    "software engineer interview simulator",
    "technical interview practice tool",
    // Problem-aware keywords (people searching for help)
    "how to pass software engineer interviews",
    "how to ace a technical interview",
    "keep failing coding interviews",
    "software engineer interview anxiety",
    "how to get better at technical interviews",
    "nervous during coding interviews",
    // Skill-gap keywords
    "how to communicate during coding interviews",
    "coding interview soft skills",
    "how to think out loud coding interview",
    "how to handle interview pressure",
    "interview confidence for engineers",
    // Long-tail content keywords
    "STAR method for software engineers",
    "how to not freeze during coding interviews",
    "biggest mistakes in software engineer interviews",
    "what FAANG interviewers actually look for",
    // Company variations
    "Google coding interview prep",
    "Meta software engineer interview",
    "Amazon behavioral interview prep",
    "system design interview practice",
    "behavioral interview software engineer",
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
    title: "Apex Interviewer | Real Interview Questions from Top Tech Companies",
    description:
      "Verified questions from actual tech interviews. Company-specific rubrics for coding, system design, and behavioral. Practice as many times as you need.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Apex Interviewer - Real Interview Questions from Top Tech"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Apex Interviewer | Real Interview Questions from Top Tech Companies",
    description:
      "Verified questions from actual tech interviews. Company-specific rubrics. Unlimited practice.",
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

// Theme initialization script to prevent FOUC (Flash of Unstyled Content)
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('apex-theme');
    var theme = stored === 'light' || stored === 'dark' 
      ? stored 
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0d0d0c' : '#fafaf8');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0d0d0c" />
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
