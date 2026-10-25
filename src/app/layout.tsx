import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description =
  "Describe a business goal. Orbit's AI agents plan it, research the live web and hand back ready-to-use deliverables.";

export const metadata: Metadata = {
  metadataBase: new URL("https://orbit-ai-agents.vercel.app"),
  title: "Orbit | Your AI operations team",
  description,
  openGraph: { title: "Orbit | Your AI operations team", description, type: "website" },
  twitter: { card: "summary_large_image", title: "Orbit | Your AI operations team", description },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
