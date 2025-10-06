// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CartFab from "@/components/CartFab";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import ShippingMarquee from "@/components/ShippingMarquee";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kuyval Fragancias",
  description: "Creado por Cáceres y Abarca",
};

const MARQ_H = 32; // alto del marquee en px

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <Providers>
          {/* Navbar (fixed dentro del componente) */}
          <Navbar />

          {/* Marquee fijo debajo del navbar. No bloquea hover del menú */}
          <div
            className="fixed inset-x-0 z-30 pointer-events-none"
            style={{ top: "var(--hdr-h, 120px)" }}
          >
            <div style={{ height: MARQ_H }}>
              <ShippingMarquee />
            </div>
          </div>

          {/* Empuje para no ocultar contenido tras navbar+marquee */}
          <main className="flex-1" style={{ paddingTop: `calc(var(--hdr-h, 120px) + ${MARQ_H}px)` }}>
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
