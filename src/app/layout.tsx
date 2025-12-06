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

const basePath = process.env.NODE_ENV === 'production' ? '/image-resizer' : '';

export const metadata: Metadata = {
  title: "Image Resizer - Crop, Resize & Compress Images",
  description: "Free online tool to crop, resize, and compress images. Supports avatar presets for social media. All processing happens in your browser - your images stay private.",
  icons: {
    icon: `${basePath}/image-resizer-favicon-favicon.ico`,
    apple: `${basePath}/image-resizer-favicon.png`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
