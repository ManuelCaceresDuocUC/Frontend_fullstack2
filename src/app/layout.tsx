// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CartFab from "@/components/CartFab";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = { title: "Kuyval Fragancias", description: "Creado por Cáceres y Abarca" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <Providers>
          <Navbar />
          {/* Empuje según --hdr-h medida por Navbar; fallback 120px */}
          <main className="flex-1" style={{ paddingTop: "var(--hdr-h, 120px)" }}>
            {children}
          </main>
          <CartFab />
          <CartDrawer />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
