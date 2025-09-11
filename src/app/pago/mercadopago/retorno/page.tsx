import { Suspense } from "react";
import RetornoClient from "./retornoClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<main className="pt-28 md:pt-36 p-6">Procesando pago…</main>}>
      <RetornoClient />
    </Suspense>
  );
}
