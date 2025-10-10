// app/empresa/reclamos/page.tsx
export const metadata = {
  title: "Reclamos y Garantía | Los Cáceres SpA",
  description: "Procedimiento de reclamos y garantía legal.",
};

export default function Page() {
  const fecha = new Date().toLocaleDateString("es-CL");
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 prose prose-invert">
      <h1>Reclamos y Garantía</h1>

      <h2>1. Retracto</h2>
      <p>
        Por razones de higiene, en <strong>decants</strong> no aplica retracto ni devoluciones, aun sin apertura.
      </p>

      <h2>2. Garantía legal (6 meses)</h2>
      <ul>
        <li>Aplica por <strong>falla de origen</strong> (envase defectuoso, fuga u otro defecto del contenedor).</li>
        <li>Opciones: reparación si es viable, cambio o devolución del dinero.</li>
      </ul>

      <h2>3. Cómo reclamar</h2>
      <ul>
        <li>Escribe a contacto@tudominio.cl o WhatsApp +56 9 9665 4293 con número de pedido, fecha y evidencia (foto o video).</li>
        <li>Acusamos recibo dentro de 48 horas hábiles.</li>
        <li>Respuesta formal en hasta 10 días hábiles.</li>
      </ul>

      <h2>4. Envío para revisión</h2>
      <ul>
        <li>Coordinamos retiro o devolución del producto según el caso.</li>
        <li>Si procede garantía, cubrimos los costos de logística de la gestión.</li>
      </ul>

      <h2>5. Escalamiento</h2>
      <p>Si no quedas conforme, puedes acudir a SERNAC.</p>

      <p className="text-sm opacity-80">Última actualización: {fecha}</p>
    </main>
  );
}
