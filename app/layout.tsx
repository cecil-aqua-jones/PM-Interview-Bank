import "./globals.css";
import { Inter, Playfair_Display } from "next/font/google";
import { Metadata } from "next";

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

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://productleaks.co";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Product Leaks | PM Interview Questions for Top Tech Companies",
    template: "%s | Product Leaks"
  },
  description:
    "Master your PM interviews with 500+ real questions from Google, Meta, Amazon, and top tech companies. AI-powered mock interviews with instant feedback.",
  keywords: [
    "product manager interview questions",
    "PM interview prep",
    "Google PM interview",
    "Meta PM interview",
    "Amazon PM interview",
    "product management",
    "FAANG interview questions",
    "tech interview preparation",
    "product sense questions",
    "execution interview questions"
  ],
  authors: [{ name: "Product Leaks" }],
  creator: "Product Leaks",
  publisher: "Product Leaks",
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Product Leaks",
    title: "Product Leaks | PM Interview Questions for Top Tech Companies",
    description:
      "Master your PM interviews with 500+ real questions from Google, Meta, Amazon, and top tech companies. AI-powered mock interviews with instant feedback.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Product Leaks - PM Interview Question Bank"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Product Leaks | PM Interview Questions for Top Tech Companies",
    description:
      "Master your PM interviews with 500+ real questions from Google, Meta, Amazon, and top tech companies.",
    images: ["/og-image.png"],
    creator: "@productleaks"
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
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
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
      <body className={`${inter.variable} ${playfair.variable}`}>
        {children}
      </body>
    </html>
  );
}
