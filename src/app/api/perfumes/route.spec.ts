import { describe, it, expect, vi } from 'vitest';
import { GET, POST } from './route';

/* ===== Tipos del mock ===== */
type VariantRec = { ml: number; price: number; stock: number; active: boolean };
type PerfumeRow = {
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

type FindManyArgs = {
  where?: Record<string, unknown>;
  orderBy?: Record<string, unknown>;
  include: { variants: true };
};

type CreateArgs = { data: Record<string, unknown> };

type CreateManyArgs = {
  data: { perfumeId: string; ml: number; price: number; stock: number; active: boolean }[];
};

type MockPrisma = {
  perfume: {
    findMany: (args: FindManyArgs) => Promise<PerfumeRow[]>;
    create: (args: CreateArgs) => Promise<{ id: string }>;
  };
  perfumeVariant: {
    createMany: (args: CreateManyArgs) => Promise<{ count: number }>;
  };
  $transaction: <T>(ops: Promise<T>[]) => Promise<T[]>;
};

/* ===== Mock Prisma ===== */
vi.mock('@/lib/prisma', () => {
  const mockPerfumes: PerfumeRow[] = [
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
  ];

  const prisma: MockPrisma = {
    perfume: {
      findMany: vi.fn(async (_args: FindManyArgs) => mockPerfumes),
      create: vi.fn(async (_args: CreateArgs) => ({ id: 'new1' })),
    },
    perfumeVariant: {
      createMany: vi.fn(async (_args: CreateManyArgs) => ({ count: 0 })),
    },
    $transaction: async <T>(ops: Promise<T>[]) => Promise.all(ops),
  };

  return { prisma };
});

/* ===== Tests ===== */
describe('API /api/perfumes', () => {
  it('GET retorna lista mapeada', async () => {
    const req = new Request('http://test/api/perfumes?categoria=ARABES', { method: 'GET' });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data: Array<{
      id: string;
      nombre: string;
      price10?: number | null;
    }> = await res.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data[0].nombre).toBe('Amber Oud Gold');
    expect(data[0].price10).toBe(8990);
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

    const json: { id: string } = await res.json();
    expect(json.id).toBe('new1');
  });
});
