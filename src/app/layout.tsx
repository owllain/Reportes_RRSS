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
  title: "ARBOLES DE EFECTIVIDAD",
  description:
    "Modern Next.js scaffold optimized for AI-powered development with Z.ai. Built with TypeScript, Tailwind CSS, and shadcn/ui.",
  keywords: [
    "Z.ai",
    "Next.js",
    "TypeScript",
    "Tailwind CSS",
    "shadcn/ui",
    "AI development",
    "React",
  ],
  authors: [{ name: "Z.ai Team" }],
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%230D4F8B%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M12 22v-3%22/><path d=%22M5.11 11.12a8 8 0 0 1 13.78 0%22/><path d=%22M5.5 13a4 4 0 1 0 5 0%22/><path d=%22M13.5 13a4 4 0 1 0 5 0%22/><path d=%22M12 13V8%22/><path d=%22M12 8a3 3 0 1 0-3-3%22/><path d=%22M12 8a3 3 0 1 1 3-3%22/></svg>',
  },
  openGraph: {
    title: "ARBOLES DE EFECTIVIDAD",
    description: "Plataforma de análisis y reporte de efectividad para canales de soporte RRSS",
    url: "https://chat.z.ai",
    siteName: "Z.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ARBOLES DE EFECTIVIDAD",
    description: "Plataforma de análisis y reporte de efectividad para canales de soporte RRSS",
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
