import React from "react";

export default function DespachosPage() {
  return (
    <main className=" pt-50" >
      <h1 className="text-3xl font-bold">Información de Despachos</h1>
      <p>
        Realizamos despachos a todo el país. Los costos de envío varían según la región y el peso del pedido.
      </p>
      <ul>
        <li><strong>Región Metropolitana:</strong> $3.000</li>
        <li><strong>Otras regiones:</strong> $5.000</li>
        <li><strong>Envío gratis</strong> por compras sobre $50.000</li>
      </ul>
      <p>
        Trabajamos con empresas de transporte confiables para asegurar la entrega de tus perfumes en óptimas condiciones.
      </p>
      <h2>Tiempos de entrega</h2>
      <ul>
        <li>Región Metropolitana: 2 a 3 días hábiles</li>
        <li>Otras regiones: 3 a 7 días hábiles</li>
      </ul>
      <h2>Términos y condiciones de despachos</h2>
      <p>
        Consulta los <a href="/pages/terminos-y-condiciones">términos y condiciones</a> para más detalles sobre envíos y devoluciones.
      </p>
    </main>
  );
}