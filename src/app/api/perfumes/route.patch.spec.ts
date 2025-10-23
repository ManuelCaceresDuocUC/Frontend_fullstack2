// src/app/api/perfumes/route.patch.spec.ts
import { describe, it, expect, vi } from 'vitest';
vi.mock('@/lib/prisma', () => {
  const updated = {
    id: '1', name: 'Percival', brand: 'PdM', ml: 100, price: 99990,
    images: ['a.jpg'], tipo: 'NICHO', genero: 'UNISEX',
    createdAt: new Date(), description: 'ok',
    variants: [{ ml: 10, price: 12990, stock: 3, active: true }]
  };
  return {
    prisma: {
      perfume: { update: vi.fn().mockResolvedValue(updated) },
      perfumeVariant: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        createMany: vi.fn().mockResolvedValue({ count: 2 })
      },
      $transaction: vi.fn(async (ops:any[]) => Promise.all(ops))
    }
  };
});
import { PATCH } from './route';

describe('PATCH /api/perfumes', () => {
  it('actualiza campos y reemplaza variants', async () => {
    const req = new Request('http://test/api/perfumes?id=1', {
      method: 'PATCH',
      body: JSON.stringify({
        nombre: 'Percival', precio: 99990,
        variants: [{ ml: 10, price: 12990, stock: 3, active: true }]
      })
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.item.price10).toBe(12990);
  });

  it('400 si falta id', async () => {
    const req = new Request('http://test/api/perfumes', { method: 'PATCH', body: '{}' });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });
});
