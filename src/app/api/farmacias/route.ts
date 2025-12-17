import { NextResponse } from 'next/server';

interface FarmaciaTurno {
  local_id: string;
  local_nombre: string;
  comuna_nombre: string;
  localidad_nombre: string;
  local_direccion: string;
  funcionamiento_dia: string;
  funcionamiento_hora_apertura: string;
  funcionamiento_hora_cierre: string;
  local_telefono: string;
  local_lat: string;
  local_lng: string;
}
export const dynamic = 'force-dynamic';


export async function GET(request: Request) {
  try {
    // 1. Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const comunaQuery = searchParams.get('comuna');
    // 2. Llamada a la API del MINSAL
    const res = await fetch('https://midas.minsal.cl/farmacia_v2/WS/getLocalesTurnos.php', {
      next: { revalidate: 3600 } 
    });

    if (!res.ok) {
      throw new Error('Error al conectar con el servicio del MINSAL');
    }

    const data: FarmaciaTurno[] = await res.json();

    // 3. Filtrado
    if (comunaQuery) {
      const dataFiltrada = data.filter((farmacia) => 
        farmacia.comuna_nombre.toUpperCase().includes(comunaQuery.toUpperCase())
      );
      
      return NextResponse.json({
        cantidad: dataFiltrada.length,
        farmacias: dataFiltrada
      });
    }

    // 4. Si no hay filtros, devolvemos todo
    return NextResponse.json({
      cantidad: data.length,
      farmacias: data
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Hubo un error obteniendo los turnos' },
      { status: 500 }
    );
  }
}