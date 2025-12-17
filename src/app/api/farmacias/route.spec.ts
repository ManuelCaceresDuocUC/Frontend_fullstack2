import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { GET } from './route';

const mockFarmaciasMinsal = [
  {
    local_id: '101',
    local_nombre: 'FARMACIA CRUZ VERDE',
    comuna_nombre: 'MAIPU',
    local_direccion: 'AV PAJARITOS 1',
  },
  {
    local_id: '102',
    local_nombre: 'FARMACIA AHUMADA',
    comuna_nombre: 'SANTIAGO',
    local_direccion: 'PASEO AHUMADA 1',
  },
  {
    local_id: '103',
    local_nombre: 'DOCTOR SIMI',
    comuna_nombre: 'MAIPU',
    local_direccion: 'AV PAJARITOS 2',
  },
];

describe('GET /api/farmacias', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('debe retornar todas las farmacias si no hay filtro', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockFarmaciasMinsal, 
    });

    const req = new Request('http://localhost:3000/api/farmacias');
    const res = await GET(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.cantidad).toBe(3);
    expect(json.farmacias).toHaveLength(3);
  });

  it('debe filtrar correctamente por comuna (MAIPU)', async () => {
    // A. CONFIGURACIÓN
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockFarmaciasMinsal,
    });

    const req = new Request('http://localhost:3000/api/farmacias?comuna=maipu');

    // B. EJECUCIÓN
    const res = await GET(req);
    const json = await res.json();

    // C. AFIRMACIÓN
    expect(res.status).toBe(200);
    expect(json.cantidad).toBe(2);
    expect(json.farmacias[0].local_nombre).toBe('FARMACIA CRUZ VERDE');
    expect(json.farmacias[1].local_nombre).toBe('DOCTOR SIMI');
  });

  it('debe manejar errores si la API del MINSAL falla (Status 500)', async () => {
    // A. CONFIGURACIÓN (Simulamos error del servidor externo)
    (global.fetch as any).mockResolvedValue({
      ok: false, // Esto activará tu: if (!res.ok) throw...
      status: 500,
    });

    const req = new Request('http://localhost:3000/api/farmacias');

    // B. EJECUCIÓN
    const res = await GET(req);
    const json = await res.json();

    // C. AFIRMACIÓN
    expect(res.status).toBe(500);
    // Este es el mensaje exacto que tienes en tu catch
    expect(json.error).toBe('Hubo un error obteniendo los turnos');
  });

  it('debe manejar errores si el MINSAL devuelve algo que no es JSON', async () => {
    // A. CONFIGURACIÓN (Simulamos error de parseo)
    (global.fetch as any).mockResolvedValue({
      ok: true,
      // Hacemos que .json() falle, simulando que llegó HTML o texto basura
      json: async () => { throw new Error('Invalid JSON') }, 
    });

    const req = new Request('http://localhost:3000/api/farmacias');

    // B. EJECUCIÓN
    const res = await GET(req);
    const json = await res.json();

    // C. AFIRMACIÓN
    // Tu código captura el error de parseo en el mismo catch genérico
    expect(res.status).toBe(500);
    expect(json.error).toBe('Hubo un error obteniendo los turnos');
  });
});