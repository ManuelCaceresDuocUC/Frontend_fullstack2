import { prisma } from "@/lib/prisma";
import AddToCartButton from "@/components/AddToCartButton";

export type PageProps = { params: { id: string } };

export default async function Page({ params }: PageProps) {
  const { id } = params;

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

  if (!p) return <div className="container mx-auto max-w-3xl p-4">Producto no encontrado.</div>;

  const imgs = Array.isArray(p.images) ? (p.images as unknown as string[]) : [];
  const img = imgs[0] ?? null;

  const money = (n: number) =>
    n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

  return (
    <div className="container mx-auto max-w-3xl p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {img && <img src={img} alt={`${p.brand} ${p.name}`} className="w-full h-auto rounded-xl" />}
        <div>
          <h1 className="text-2xl font-semibold">{p.brand} {p.name}</h1>

          <div className="mt-4 space-y-2">
            {p.variants.map(v => (
              <div key={v.id} className="flex items-center justify-between border rounded-xl p-3">
                <div>{v.ml} ml</div>
                <div className="flex items-center gap-4">
                  <span className="font-medium">{money(v.price)}</span>
                  <span className={`text-sm ${v.stock > 0 ? "text-green-600" : "text-red-600"}`}>
                    {v.stock > 0 ? `Stock: ${v.stock}` : "Sin stock"}
                  </span>
                  <AddToCartButton
                    productId={p.id}
                    variantId={v.id}
                    name={p.name}
                    brand={p.brand}
                    ml={v.ml}
                    price={v.price}
                    stock={v.stock}
                    image={img}
                    disabled={v.stock <= 0}
                  />
                </div>
              </div>
            ))}
          </div>

          {p.description && <p className="mt-6 text-slate-700">{p.description}</p>}
        </div>
      </div>
    </div>
  );
}
