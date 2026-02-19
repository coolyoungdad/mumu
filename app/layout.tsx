import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import PostHogProvider from "@/components/PostHogProvider";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "PomPom - Mystery Box Shopping",
  description: "The mystery box shopping game. Buy boxes, reveal real products from top brands.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} antialiased`}>
        {/* Floating decorative icons — fixed to viewport at root level */}
        <div
          className="fixed top-[14%] left-[7%] pointer-events-none select-none z-0 animate-float-slow"
          aria-hidden="true"
        >
          <div className="w-24 h-24 rounded-3xl bg-pink-100 flex items-center justify-center shadow-md rotate-[-12deg]">
            <span className="text-5xl">🩷</span>
          </div>
        </div>
        <div
          className="fixed top-[52%] right-[6%] pointer-events-none select-none z-0 animate-float-delayed"
          aria-hidden="true"
        >
          <div className="w-20 h-20 rounded-3xl bg-orange-100 flex items-center justify-center shadow-md rotate-[10deg]">
            <span className="text-4xl">⭐</span>
          </div>
        </div>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
