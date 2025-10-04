// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CartFab from "@/components/CartFab";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer"; // <-- respeta mayúsculas
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import ShippingMarquee from "@/components/ShippingMarquee";


const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kuyval Fragancias",
  description: "Creado por Cáceres y Abarca",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
                  <ShippingMarquee className="sticky top-[56px]" /> {/* ajusta el top a la altura de tu navbar */}

          <CartFab />
          <CartDrawer />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
