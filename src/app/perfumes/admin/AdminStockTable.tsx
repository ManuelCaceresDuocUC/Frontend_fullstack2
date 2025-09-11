"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Row = { id: string; nombre: string; marca: string; ml: number; precio: number; qty: number };

export default function AdminStockTable({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const save = async (id: string, qty: number) => {
    const prev = rows;
    setRows(r => r.map(x => (x.id === id ? { ...x, qty } : x)));
    const res = await fetch(`/api/stock/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qty }),
    });
    if (!res.ok) {
      setRows(prev);
      alert("Error guardando stock");
      return;
    }
    startTransition(() => router.refresh());
  };

  const money = (n: number) => n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

  return (
    <main className="px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Inventario</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Perfume</th>
              <th className="py-2">ML</th>
              <th className="py-2">Precio</th>
              <th className="py-2">Stock</th>
              <th className="py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b">
                <td className="py-2">{r.marca} {r.nombre}</td>
                <td>{r.ml}</td>
                <td>{money(r.precio)}</td>
                <td>
                  <input
                    type="number"
                    min={0}
                    value={r.qty}
                    onChange={e =>
                      setRows(rs =>
                        rs.map(x =>
                          x.id === r.id ? { ...x, qty: Math.max(0, parseInt(e.target.value || "0", 10)) } : x
                        )
                      )
                    }
                    className="w-24 rounded border px-2 py-1 bg-white text-black"
                  />
                </td>
                <td className="space-x-2 py-2">
                  <button onClick={() => save(r.id, Math.max(0, r.qty - 1))} className="px-2 py-1 rounded border">-1</button>
                  <button onClick={() => save(r.id, r.qty + 1)} className="px-2 py-1 rounded border">+1</button>
                  <button onClick={() => save(r.id, r.qty)} className="px-3 py-1 rounded bg-blue-600 text-white">
                    {pending ? "Guardando..." : "Guardar"}
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
