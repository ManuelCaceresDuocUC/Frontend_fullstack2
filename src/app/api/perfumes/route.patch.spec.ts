import { describe, it, expect, vi } from 'vitest';
import { PATCH } from './route';

/* ===== Tipos del mock ===== */
type VariantRec = { id?: string; ml: number; price: number; stock: number; active: boolean };
type UpdatedPerfume = {
  id: string;
  name: string;
  brand: string;
  ml: number;
  price: number;
  images: string[];
  tipo: 'NICHO' | 'ARABES' | 'DISENADOR' | 'OTROS';
  genero: 'HOMBRE' | 'MUJER' | 'UNISEX';
  createdAt: Date;
  description: string | null;
  variants: VariantRec[];
};
type MockPrisma = {
  perfume: {
    update: (args: {
      where: { id: string };
      data: Record<string, unknown>;
      include: { variants: true };
    }) => Promise<UpdatedPerfume>;
  };
  perfumeVariant: {
    deleteMany: (args: { where: { perfumeId: string } }) => Promise<{ count: number }>;
    createMany: (args: {
      data: { perfumeId: string; ml: number; price: number; stock: number; active: boolean }[];
    }) => Promise<{ count: number }>;
  };
  $transaction: <T>(ops: Promise<T>[]) => Promise<T[]>;
};

/* ===== Mock de prisma ===== */
vi.mock('@/lib/prisma', () => {
  const updated: UpdatedPerfume = {
    id: '1',
    name: 'Percival',
    brand: 'PdM',
    ml: 100,
    price: 99990,
    images: ['a.jpg'],
    tipo: 'NICHO',
    genero: 'UNISEX',
    createdAt: new Date(),
    description: 'ok',
    variants: [{ ml: 10, price: 12990, stock: 3, active: true }],
  };

  const prisma: MockPrisma = {
    perfume: {
      update: vi.fn(async () => updated),
    },
    perfumeVariant: {
      deleteMany: vi.fn(async () => ({ count: 1 })),
      createMany: vi.fn(async () => ({ count: 2 })),
    },
    $transaction: async <T>(ops: Promise<T>[]) => Promise.all(ops),
  };

  return { prisma };
});

/* ===== Tests ===== */
describe('PATCH /api/perfumes', () => {
  it('actualiza campos y reemplaza variants', async () => {
    const req = new Request('http://test/api/perfumes?id=1', {
      method: 'PATCH',
      body: JSON.stringify({
        nombre: 'Percival',
        precio: 99990,
        variants: [{ ml: 10, price: 12990, stock: 3, active: true }],
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const json: { ok: boolean; item: { price10?: number | null } } = await res.json();
    expect(json.ok).toBe(true);
    expect(json.item.price10).toBe(12990);
  });

  it('400 si falta id', async () => {
    const req = new Request('http://test/api/perfumes', { method: 'PATCH', body: '{}' });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });
});
