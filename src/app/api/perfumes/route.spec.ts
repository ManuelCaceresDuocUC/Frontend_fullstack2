// src/app/api/perfumes/route.spec.ts
import { describe, it, expect, vi } from 'vitest';

// 1) Mock del cliente Prisma que usa la ruta
vi.mock('@/lib/prisma', () => {
  const perfume = {
    findMany: vi.fn().mockResolvedValue([
      {
        id: '1',
        name: 'Amber Oud Gold',
        brand: 'Al Haramain',
        ml: 100,
        price: 49990,
        images: ['a.jpg'],
        tipo: 'ARABES',
        genero: 'UNISEX',
        createdAt: new Date(),
        description: '',
        variants: [
          { ml: 3, price: 2990, stock: 10, active: true },
          { ml: 5, price: 4990, stock: 5, active: true },
          { ml: 10, price: 8990, stock: 2, active: true },
        ],
      },
    ]),
    create: vi.fn().mockResolvedValue({ id: 'new1' }),
  };

  const perfumeVariant = {
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
  };

  const prisma = {
    perfume,
    perfumeVariant,
    $transaction: vi.fn(async (ops: any[]) => Promise.all(ops)),
  };

  return { prisma };
});

// 2) Importa la SUT después del mock
import { GET, POST } from './route';

describe('API /api/perfumes', () => {
  it('GET retorna lista mapeada', async () => {
    const req = new Request('http://test/api/perfumes?categoria=ARABES', { method: 'GET' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].nombre).toBe('Amber Oud Gold'); // viene del mock
    expect(data[0].price10).toBe(8990);            // de la variante mockeada
  });

  it('POST crea perfume válido y devuelve 201', async () => {
    const body = {
      nombre: 'CDNIM',
      marca: 'Armaf',
      ml: 105,
      precio: 39990,
      categoria: 'ARABES',
      genero: 'UNISEX',
      descripcion: 'prueba',
      imagenes: ['x.jpg'],
      variants: [
        { ml: 5, price: 4990, stock: 5, active: true },
        { ml: 10, price: 8990, stock: 3, active: true },
      ],
    };

    const req = new Request('http://test/api/perfumes', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe('new1');
  });
});
