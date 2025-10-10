// app/empresa/despachos/page.tsx
export const metadata = {
  title: "Política de Despachos | Los Cáceres SpA",
  description: "Couriers, plazos y costos de envío.",
};

export default function Page() {
  const fecha = new Date().toLocaleDateString("es-CL");
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 prose prose-invert">
      <h1>Política de Despachos</h1>

      <h2>1. Modalidad</h2>
      <ul>
        <li>Envíos con <strong>Bluexpress</strong> a domicilio o punto de retiro.</li>
        <li>Preparación: 24–48 horas hábiles desde el pago confirmado.</li>
      </ul>

      <h2>2. Plazos estimados del courier</h2>
      <ul>
        <li>RM y zonas cercanas: 24–72 horas hábiles.</li>
        <li>Centro–Sur: 2–4 días hábiles.</li>
        <li>Zonas extremas: 3–7 días hábiles.</li>
      </ul>
      <p>Fechas de alta demanda pueden extender los plazos del courier.</p>

      <h2>3. Costos y envío gratis</h2>
      <ul>
        <li>Se calculan en el checkout según destino.</li>
        <li><strong>Envío gratis</strong> por compras iguales o superiores a <strong>$49.990</strong>.</li>
      </ul>

      <h2>4. Seguimiento</h2>
      <p>Enviamos el número de seguimiento al correo indicado. Si no lo recibes en 48 horas hábiles, contáctanos.</p>

      <h2>5. Responsabilidades</h2>
      <ul>
        <li>Dirección y datos del receptor deben ser correctos.</li>
        <li>Si el paquete llega dañado, recházalo o registra evidencia al recibir y avísanos dentro de 24 horas.</li>
        <li>Retrasos por dirección incorrecta o ausencia del receptor no son atribuibles a la empresa.</li>
      </ul>

      <p className="text-sm opacity-80">Última actualización: {fecha}</p>
    </main>
  );
}
