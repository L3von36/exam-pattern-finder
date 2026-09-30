import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Exam Pattern Finder — powered by LAYA",
  description:
    "Paste a past exam paper and let the LAYA exam-pattern engine surface recurring topics, question-type mixes, difficulty weighting, and predicted focus areas.",
  keywords: ["exam analysis", "exam patterns", "LAYA", "Hugging Face", "study tools", "AI"],
  authors: [{ name: "Exam Pattern Finder" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Exam Pattern Finder — powered by LAYA",
    description: "Find the patterns hiding in your exams.",
    url: "https://chat.z.ai",
    siteName: "Exam Pattern Finder",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Exam Pattern Finder",
    description: "Find the patterns hiding in your exams.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
