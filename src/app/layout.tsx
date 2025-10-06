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

// Ajusta estos dos números a tus alturas reales:
const NAV_H = 56;    // px de tu Navbar
const MARQ_H = 32;   // px de tu ShippingMarquee

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
        style={
          {
            // expone variables CSS por si quieres usarlas en otros componentes
            ["--nav-h" as any]: `${NAV_H}px`,
            ["--marq-h" as any]: `${MARQ_H}px`,
          } as React.CSSProperties
        }
      >
        <Providers>
          {/* Header fijo con navbar + marquee */}
          <div className="fixed inset-x-0 top-0 z-50">
            <div style={{ height: NAV_H }}>
              <Navbar />
            </div>
            <div style={{ height: MARQ_H }}>
              <ShippingMarquee />
            </div>
          </div>

          {/* Empuje para que nada quede bajo el header */}
          <main className="flex-1" style={{ paddingTop: `calc(${NAV_H}px + ${MARQ_H}px)` }}>
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
