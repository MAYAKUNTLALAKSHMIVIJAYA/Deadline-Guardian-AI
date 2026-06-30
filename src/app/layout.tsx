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

export const metadata: Metadata = {
  title: "Deadline Guardian AI | The AI Chief Productivity Officer",
  description: "A futuristic AI Operating System that thinks, prioritizes, negotiates schedules, calculates risk, and ensures you never miss what matters.",
  openGraph: {
    title: "Deadline Guardian AI",
    description: "Futuristic AI Operating System that ensures you never miss what matters.",
    url: "https://deadline-guardian-ai.run.app",
    siteName: "Deadline Guardian AI",
    images: [
      {
        url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=guardian",
        width: 800,
        height: 600,
        alt: "Deadline Guardian AI Icon",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Deadline Guardian AI",
    description: "The AI that ensures you never miss what matters.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Futuristic Aurora Gradient Blobs */}
        <div className="aurora-bg">
          <div className="aurora-blur aurora-blob-1"></div>
          <div className="aurora-blur aurora-blob-2"></div>
          <div className="aurora-blur aurora-blob-3"></div>
        </div>
        {children}
      </body>
    </html>
  );
}
