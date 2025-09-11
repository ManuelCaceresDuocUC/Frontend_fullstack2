import { Suspense } from "react";
// ❌ import GaleriaClient from "app/galeria/GaleriaClient";
import GaleriaClient from "./galeriaClient";

export default function Page() {
  return (
    <Suspense fallback={<main className="pt-28 md:pt-36 min-h-screen" />}>
      <GaleriaClient />
    </Suspense>
  );
}
