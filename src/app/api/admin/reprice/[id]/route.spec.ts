// src/app/api/admin/reprice/[id]/route.spec.ts
import { describe, it, expect, vi } from 'vitest';

// 1) Mocks
vi.mock('@/lib/prisma', () => {
  const perfume = {
    findUnique: vi.fn().mockResolvedValue({
      id: '1',
      name: 'X', brand: 'Y',
      ml: 100, price: 50000,
      priceUsd: null, labelleUsd: null, importFactor: null, exchangeRate: null,
      bottleMl: null, bottleOz: null,
      variants: [{ id: 'v5', ml: 5 }, { id: 'v10', ml: 10 }]
    }),
  };
  const updates: any[] = [];
  const perfumeVariant = {
    update: vi.fn().mockImplementation(({ where: { id }, data: { price } }) => {
      updates.push({ id, price }); return { id, price };
    })
  };
  const db = { perfume, perfumeVariant, $transaction: vi.fn(async (ops:any[]) => {
    const res = await Promise.all(ops); return res;
  })};
  return { db };
});

vi.mock('@/lib/pricing', () => ({
  // fuerza valores estables
  computeVariantPrice: vi.fn(({ ml }) => ml * 1000), // 5->5000, 10->10000
  marginForMl: vi.fn((ml:number) => ml >= 10 ? 1.3 : 1.4),
  round990Up: vi.fn((n:number) => Math.ceil(n / 1000) * 1000 - 10) // 4990, 8990, etc.
}));

import { POST } from './route';

const ctx = { params: Promise.resolve({ id: '1' }) } as any;

describe('POST /api/admin/reprice/[id]', () => {
  it('recalcula por CLP cuando no hay USD', async () => {
    const req = new Request('http://test/api/admin/reprice/1', { method: 'POST' });
    const res = await POST(req, ctx);
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.ok).toBe(true);
    expect(j.updated).toBe(2);
  });

  it('usa pricing USD cuando hay priceUsd', async () => {
    const { db } = await import('@/lib/prisma');
    // modifica el mock para esta corrida
    (db.perfume.findUnique as any).mockResolvedValueOnce({
      id:'1', ml:100, price:50000, priceUsd: 120, importFactor:1.25, exchangeRate:900,
      bottleMl: 100, bottleOz: null, labelleUsd: null,
      variants: [{ id:'v5', ml:5 }, { id:'v10', ml:10 }]
    });
    const req = new Request('http://test/api/admin/reprice/1', { method: 'POST' });
    const res = await POST(req, ctx);
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.updated).toBe(2);
  });

  it('404 si perfume no existe', async () => {
    const { db } = await import('@/lib/prisma');
    (db.perfume.findUnique as any).mockResolvedValueOnce(null);
    const req = new Request('http://test/api/admin/reprice/xxx', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'xxx' }) } as any);
    expect(res.status).toBe(404);
  });

  it('200 updated=0 si no hay variantes válidas', async () => {
    const { db } = await import('@/lib/prisma');
    (db.perfume.findUnique as any).mockResolvedValueOnce({
      id:'1', ml:100, price:0, priceUsd:null, bottleMl:null, variants:[{ id:'v?', ml:0 }]
    });
    const req = new Request('http://test/api/admin/reprice/1', { method: 'POST' });
    const res = await POST(req, ctx);
    const j = await res.json();
    expect(j.updated).toBe(0);
  });
});
