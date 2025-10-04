// src/app/producto/[id]/page.tsx
import { prisma } from "@/lib/prisma";

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = params;

  const producto = await prisma.perfume.findUnique({
    where: { id },
    include: { variants: true },
  });

  if (!producto) {
    return <div className="p-8">Producto no encontrado</div>;
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">{producto.brand} {producto.name}</h1>
      {/* renderiza lo que necesites */}
    </main>
  );
}
