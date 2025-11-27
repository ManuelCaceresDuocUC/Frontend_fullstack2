import { NextResponse } from 'next/server';
import https from 'https';

// Desactivamos la verificación estricta de SSL solo para este agente
const agent = new https.Agent({
  rejectUnauthorized: false
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const comunaQuery = searchParams.get('comuna');

    // Usamos el agente personalizado y añadimos headers para parecer un navegador
    const res = await fetch('https://midas.minsal.cl/farmacia_v2/WS/getLocalesTurnos.php', {
      next: { revalidate: 3600 },
      // @ts-ignore: Next.js fetch extiende el nativo, pero TypeScript a veces reclama por 'agent'
      agent: agent, 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) {
      throw new Error(`Error del servidor MINSAL: ${res.status} ${res.statusText}`);
    }

    // Intentamos parsear el JSON. Si la API devuelve HTML (error), esto fallará y caerá en el catch
    const textData = await res.text();
    let data;
    try {
        data = JSON.parse(textData);
    } catch (e) {
        console.error("La respuesta no es un JSON válido:", textData.substring(0, 100));
        throw new Error('La API del Minsal no devolvió un JSON válido.');
    }

    if (comunaQuery) {
      const dataFiltrada = data.filter((farmacia: any) => 
        farmacia.comuna_nombre.toUpperCase().includes(comunaQuery.toUpperCase())
      );
      
      return NextResponse.json({
        cantidad: dataFiltrada.length,
        farmacias: dataFiltrada
      });
    }

    return NextResponse.json({
      cantidad: data.length,
      farmacias: data
    });

  } catch (error: any) {
    // Este console.error aparecerá en los LOGS de Vercel
    console.error("❌ Error en API Farmacias:", error.message);
    
    return NextResponse.json(
      { error: 'Hubo un error obteniendo los turnos', details: error.message },
      { status: 500 }
    );
  }
}