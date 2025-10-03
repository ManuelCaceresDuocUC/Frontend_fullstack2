// src/app/perfumes/admin/AdminStockTable.tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Variant = { id: string; ml: number; price: number; stock: number; active: boolean };
type Row = { id: string; nombre: string; marca: string; variants: Variant[] };

const ML = [3, 5, 10] as const;
const money = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export default function AdminStockTable({ initialRows }: { initialRows: Row[] }) {
  // normaliza a Record<ml, {stock, price}>
  const [rows, setRows] = useState(() =>
    initialRows.map((r) => ({
      ...r,
      map: ML.reduce<Record<number, { stock: number; price: number }>>((acc, ml) => {
        const v = r.variants.find((x) => x.ml === ml);
        acc[ml] = { stock: v?.stock ?? 0, price: v?.price ?? 0 };
        return acc;
      }, {}),
    }))
  );

  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const setStock = (perfumeId: string, ml: number, next: number) =>
    setRows((rs) =>
      rs.map((r) =>
        r.id !== perfumeId ? r : { ...r, map: { ...r.map, [ml]: { ...r.map[ml], stock: Math.max(0, next) } } }
      )
    );

  const patchOne = async (perfumeId: string, ml: number, stock: number) => {
    const res = await fetch(`/api/stock/${perfumeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ml, stock }),
    });
    if (!res.ok) throw new Error(`Error actualizando ${ml} ml`);
  };

  const saveOne = async (perfumeId: string, ml: number, stock: number) => {
    try {
      await patchOne(perfumeId, ml, stock);
      startTransition(() => router.refresh());
    } catch (e) {
      alert((e as Error).message || "Error guardando stock");
    }
  };

  const saveAll = async (perfumeId: string, rec: (typeof rows)[number]) => {
    try {
      await Promise.all(ML.map((ml) => patchOne(perfumeId, ml, rec.map[ml].stock)));
      startTransition(() => router.refresh());
    } catch (e) {
      alert((e as Error).message || "Error guardando stock");
    }
  };

  return (
    <main className="px-6 py-8">
      <h1 className="mb-4 text-2xl font-bold">Inventario por variante</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Perfume</th>
              {ML.map((ml) => (
                <th key={ml} className="py-2">
                  {ml} ml
                </th>
              ))}
              <th className="py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b align-top">
                <td className="py-2 pr-4">
                  <div className="font-medium">{r.marca} {r.nombre}</div>
                  <div className="text-xs text-slate-500">
                    {ML.map((ml) => (
                      <span key={ml} className="mr-3">
                        {ml} ml: {money(r.map[ml].price)}
                      </span>
                    ))}
                  </div>
                </td>

                {ML.map((ml) => (
                  <td key={ml} className="py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setStock(r.id, ml, r.map[ml].stock - 1)}
                        className="rounded border px-2 py-1"
                        aria-label={`-1 ${ml} ml`}
                      >
                        -1
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={r.map[ml].stock}
                        onChange={(e) => setStock(r.id, ml, Math.max(0, parseInt(e.target.value || "0", 10)))}
                        className="w-24 rounded border px-2 py-1 bg-white text-black"
                        aria-label={`Stock ${ml} ml`}
                      />
                      <button
                        onClick={() => setStock(r.id, ml, r.map[ml].stock + 1)}
                        className="rounded border px-2 py-1"
                        aria-label={`+1 ${ml} ml`}
                      >
                        +1
                      </button>
                      <button
                        onClick={() => saveOne(r.id, ml, r.map[ml].stock)}
                        className="rounded bg-blue-600 px-3 py-1 text-white"
                      >
                        {pending ? "..." : "Guardar"}
                      </button>
                    </div>
                  </td>
                ))}

                <td className="py-2">
                  <button
                    onClick={() => saveAll(r.id, r)}
                    className="rounded bg-emerald-600 px-3 py-1 text-white"
                  >
                    {pending ? "Guardando..." : "Guardar todo"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
