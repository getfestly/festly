import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PosthogProvider from "@/components/PosthogProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Festly",
  description: "Der Marktplatz für Event-Dienstleistungen",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PosthogProvider>
          <Suspense fallback={<div className="sticky top-0 z-50 h-16 bg-white border-b border-gray-100" />}>
            <Nav />
          </Suspense>
          {children}
          <Footer />
        </PosthogProvider>
      </body>
    </html>
  );
}
