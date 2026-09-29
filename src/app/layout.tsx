import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "GetSetGrades | Online Tutoring & Academic Support",
    template: "%s | GetSetGrades",
  },
  description: siteConfig.description,
  keywords: [
    "online tutoring",
    "academic support",
    "study help",
    "assignment guidance",
    "homework support",
    "programming help",
    "mathematics support",
    "research guidance",
    "exam preparation",
    "English writing support",
    "tutor matching",
    "GetSetGrades",
    "GetSetGrades AI",
  ],
  authors: [{ name: "GetSetGrades" }],
  creator: "GetSetGrades",
  publisher: "GetSetGrades",
  applicationName: "GetSetGrades",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "GetSetGrades | Online Tutoring & Academic Support",
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: "GetSetGrades",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/brand/getsetgrades-logo.png",
        width: 1200,
        height: 600,
        alt: "GetSetGrades Academic support, without the stress.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GetSetGrades | Online Tutoring & Academic Support",
    description: siteConfig.description,
    images: ["/brand/getsetgrades-logo.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brand/getsetgrades-icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/getsetgrades-icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/brand/getsetgrades-icon-180.png", sizes: "180x180" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          `${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`,
          "min-h-screen flex flex-col"
        )}
      >
        {children}
        <Toaster />
        <SonnerToaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
