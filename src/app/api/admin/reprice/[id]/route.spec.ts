// src/app/api/admin/reprice/[id]/route.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { POST } from './route';

/* ===== Tipos del mock ===== */
type Variant = { id: string; ml: number };
type PerfumeRecord = {
  id: string;
  ml: number;
  price: number;
  priceUsd?: number | null;
  labelleUsd?: number | null;
  importFactor?: number | null;
  exchangeRate?: number | null;
  bottleMl?: number | null;
  bottleOz?: number | null;
  variants: Variant[];
};
type UpdateArgs = { where: { id: string }; data: { price: number } };
type MockDB = {
  perfume: {
    findUnique: (args: { where: { id: string }; include: { variants: { select: { id: true; ml: true } } } }) => Promise<PerfumeRecord | null>;
  };
  perfumeVariant: {
    update: (args: UpdateArgs) => Promise<{ id: string; price: number }>;
  };
  $transaction: <T>(ops: Promise<T>[]) => Promise<T[]>;
};

/* ===== Mock de prisma (exporta db) ===== */
vi.mock('@/lib/prisma', () => {
  const db: MockDB = {
    perfume: {
      findUnique: vi.fn().mockResolvedValue({
        id: '1',
        ml: 100,
        price: 50000,
        priceUsd: null,
        labelleUsd: null,
        importFactor: null,
        exchangeRate: null,
        bottleMl: null,
        bottleOz: null,
        variants: [{ id: 'v5', ml: 5 }, { id: 'v10', ml: 10 }],
      }),
    },
    perfumeVariant: {
      update: vi.fn().mockImplementation((args: UpdateArgs) =>
        Promise.resolve({ id: args.where.id, price: args.data.price })
      ),
    },
    $transaction: async <T>(ops: Promise<T>[]) => Promise.all(ops),
  };
  return { db };
});

/* ===== Mock de pricing ===== */
vi.mock('@/lib/pricing', () => ({
  computeVariantPrice: vi.fn((p: { ml: number }) => p.ml * 1000),
  marginForMl: vi.fn((ml: number) => (ml >= 10 ? 1.3 : 1.4)),
  round990Up: vi.fn((n: number) => Math.ceil(n / 1000) * 1000 - 10),
}));

/* ===== Helper: obtener db mockeado tipado ===== */
async function getMockDb(): Promise<MockDB> {
  const mod = (await import('@/lib/prisma')) as unknown as { db: MockDB };
  return mod.db;
}

/* ===== Ctx tipado ===== */
const ctx: { params: Promise<{ id: string }> } = { params: Promise.resolve({ id: '1' }) };

/* ===== Tests ===== */
describe('POST /api/admin/reprice/[id]', () => {
  it('recalcula por CLP cuando no hay USD', async () => {
    const req = new Request('http://test/api/admin/reprice/1', { method: 'POST' });
    const res = await POST(req, ctx);
    expect(res.status).toBe(200);
    const j: { ok: boolean; updated: number } = await res.json();
    expect(j.ok).toBe(true);
    expect(j.updated).toBe(2);
  });

  it('usa pricing USD cuando hay priceUsd', async () => {
    const db = await getMockDb();
    db.perfume.findUnique = vi.fn().mockResolvedValue({
      id: '1',
      ml: 100,
      price: 50000,
      priceUsd: 120,
      importFactor: 1.25,
      exchangeRate: 900,
      bottleMl: 100,
      bottleOz: null,
      labelleUsd: null,
      variants: [{ id: 'v5', ml: 5 }, { id: 'v10', ml: 10 }],
    });

    const req = new Request('http://test/api/admin/reprice/1', { method: 'POST' });
    const res = await POST(req, ctx);
    expect(res.status).toBe(200);
    const j: { ok: boolean; updated: number } = await res.json();
    expect(j.updated).toBe(2);
  });

  it('404 si perfume no existe', async () => {
    const db = await getMockDb();
    db.perfume.findUnique = vi.fn().mockResolvedValue(null);

    const req = new Request('http://test/api/admin/reprice/xxx', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'xxx' }) });
    expect(res.status).toBe(404);
  });

  it('200 updated=0 si no hay variantes válidas', async () => {
    const db = await getMockDb();
    db.perfume.findUnique = vi.fn().mockResolvedValue({
      id: '1',
      ml: 100,
      price: 0,
      priceUsd: null,
      labelleUsd: null,
      importFactor: null,
      exchangeRate: null,
      bottleMl: null,
      bottleOz: null,
      variants: [{ id: 'v?', ml: 0 }],
    });

    const req = new Request('http://test/api/admin/reprice/1', { method: 'POST' });
    const res = await POST(req, ctx);
    const j: { ok: boolean; updated: number } = await res.json();
    expect(j.updated).toBe(0);
  });
});
