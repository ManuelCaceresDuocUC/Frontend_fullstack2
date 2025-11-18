import { NextResponse } from 'next/server';

// Definimos la interfaz de los datos que vienen del MINSAL para tener autocompletado
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

export async function GET(request: Request) {
  try {
    // 1. Obtener parámetros de búsqueda (ej: ?comuna=maipu)
    const { searchParams } = new URL(request.url);
    const comunaQuery = searchParams.get('comuna');

    // 2. Llamada a la API del MINSAL
    // Usamos revalidate para no saturar la API oficial. Los turnos duran 24hrs, 
    // así que actualizar cada 1 hora (3600 seg) es seguro y rápido.
    const res = await fetch('https://midas.minsal.cl/farmacia_v2/WS/getLocalesTurnos.php', {
      next: { revalidate: 3600 } 
    });

    if (!res.ok) {
      throw new Error('Error al conectar con el servicio del MINSAL');
    }

    const data: FarmaciaTurno[] = await res.json();

    // 3. Filtrado (Opcional)
    // Si el usuario pidió una comuna específica, filtramos el array gigante de 575 datos.
    if (comunaQuery) {
      const dataFiltrada = data.filter((farmacia) => 
        // Normalizamos a mayúsculas porque la API suele entregar "MAIPU" o "PROVIDENCIA"
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