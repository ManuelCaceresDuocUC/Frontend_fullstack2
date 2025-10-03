import { prisma } from "@/lib/prisma";
import AddToCartButton from "@/components/AddToCartButton";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const p = await prisma.perfume.findUnique({
    where: { id },
    include: {
      variants: {
        where: { active: true },
        select: { id: true, ml: true, price: true, stock: true },
        orderBy: { ml: "asc" },
      },
    },
  });
  if (!p) return null;

  const imgs = Array.isArray(p.images) ? (p.images as unknown as string[]) : [];
  const img = imgs[0] ?? null;

  const money = (n: number) =>
    n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

  return (
    <div className="container mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-semibold">
        {p.brand} {p.name}
      </h1>

      <div className="mt-4 space-y-3">
        {p.variants.map((v) => (
          <div key={v.id} className="flex items-center justify-between rounded border p-3">
            <div>
              <div className="font-medium">{v.ml} ml</div>
              <div className="text-sm text-slate-600">{money(v.price)}</div>
              <div className="text-sm text-slate-600">
                Stock: {v.stock} {v.stock === 0 && "(sin stock)"}
              </div>
            </div>

            <AddToCartButton
              productId={p.id}
              variantId={v.id}
              name={p.name}
              brand={p.brand}
              ml={v.ml}
              price={v.price}
              image={img}
              stock={v.stock}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
