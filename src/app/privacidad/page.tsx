// app/empresa/privacidad/page.tsx
export const metadata = {
  title: "Política de Privacidad | Los Cáceres SpA",
  description: "Tratamiento de datos personales y cookies.",
};

export default function Page() {
  const fecha = new Date().toLocaleDateString("es-CL");
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 prose prose-invert">
      <h1>Política de Privacidad</h1>

      <h2>1. Responsable</h2>
      <p>Los Cáceres SpA (RUT 78.255.686-K). Contacto: contacto@tudominio.cl, +56 9 9665 4293.</p>

      <h2>2. Datos que tratamos</h2>
      <ul>
        <li>Identificación y contacto: nombre, email, teléfono, dirección.</li>
        <li>Datos de compra y despacho: productos, montos, seguimiento.</li>
        <li>Datos técnicos mínimos del sitio: IP, cookies necesarias, registros de error.</li>
      </ul>

      <h2>3. Finalidades</h2>
      <ul>
        <li>Procesar compras, emitir boleta electrónica, realizar despachos y gestionar reclamos.</li>
        <li>Prevención de fraude y seguridad del sitio.</li>
      </ul>

      <h2>4. Base legal</h2>
      <p>Consentimiento del titular y cumplimiento de obligaciones legales (boleta electrónica y contabilidad).</p>

      <h2>5. Encargados y terceros</h2>
      <ul>
        <li>Transbank (pago) y Bluexpress (envío) reciben lo mínimo necesario para su función.</li>
        <li>No vendemos datos.</li>
      </ul>

      <h2>6. Derechos del titular</h2>
      <p>Acceder, rectificar, cancelar u oponerse según Ley 19.628. Escríbenos para ejercerlos.</p>

      <h2>7. Cookies</h2>
      <ul>
        <li>Necesarias: para login, carrito y checkout.</li>
        <li>Analíticas/publicidad: solo si habilitas, con aviso y opción de rechazo.</li>
      </ul>

      <h2>8. Conservación</h2>
      <p>Conservamos datos por los plazos legales tributarios y por garantías. Luego se eliminan o anonimizan.</p>

      <h2>9. Seguridad</h2>
      <p>Buenas prácticas técnicas y organizativas. Acceso restringido. Encriptación en tránsito.</p>

      <p className="text-sm opacity-80">Última actualización: {fecha}</p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "PrivacyPolicy",
            name: "Política de Privacidad",
            inLanguage: "es-CL",
            dateModified: new Date().toISOString(),
            url: "https://tudominio.cl/empresa/privacidad",
          }),
        }}
      />
    </main>
  );
}
