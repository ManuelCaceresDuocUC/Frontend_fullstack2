// app/empresa/terminos/page.tsx
export const metadata = {
  title: "Términos y Condiciones | Los Cáceres SpA",
  description: "Condiciones de uso y compra.",
};

export default function Page() {
  const fecha = new Date().toLocaleDateString("es-CL");
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 prose prose-invert">
      <h1>Términos y Condiciones</h1>

      <p><strong>Razón social:</strong> Los Cáceres SpA</p>
      <p><strong>RUT:</strong> 78.255.686-K</p>
      <p><strong>Teléfono:</strong> +56 9 9665 4293</p>
      <p><strong>Correo:</strong> contacto@tudominio.cl {/* cambia cuando tengas el corporativo */}</p>
      <p className="text-sm opacity-80">Última actualización: {fecha}</p>

      <h2>1. Aceptación</h2>
      <p>
        Al comprar en este sitio aceptas estas condiciones. Regulan la relación entre Los Cáceres SpA y los clientes.
      </p>

      <h2>2. Giro y productos</h2>
      <ul>
        <li>Venta de <strong>decants</strong> de perfumes originales importados desde Miami, fraccionados en envases nuevos de distintos mililitros.</li>
        <li>Imágenes referenciales. Color del líquido o forma del envase puede variar.</li>
      </ul>

      <h2>3. Precios e impuestos</h2>
      <ul>
        <li>Precios en pesos chilenos (CLP), <strong>IVA incluido</strong>.</li>
        <li>Los precios pueden cambiar. Se respeta el valor vigente al pagar.</li>
      </ul>

      <h2>4. Disponibilidad y pedidos</h2>
      <ul>
        <li>Stock sujeto a confirmación al concretar el pago.</li>
        <li>Podemos anular pedidos por errores evidentes de precio o stock. Reintegro total si ya pagaste.</li>
      </ul>

      <h2>5. Medios de pago</h2>
      <p>Webpay (Transbank) con tarjetas de débito o crédito. No hay contraentrega ni transferencias.</p>

      <h2>6. Despachos</h2>
      <p>Se aplican las reglas publicadas en <a href="/empresa/despachos">Política de Despachos</a>.</p>

      <h2>7. Retracto y devoluciones</h2>
      <ul>
        <li>Por higiene, <strong>no hay retracto ni devoluciones</strong> en decants, aun sin abrir.</li>
        <li>La garantía legal por falla aplica según la sección de <a href="/empresa/reclamos">Reclamos y Garantía</a>.</li>
      </ul>

      <h2>8. Boleta electrónica</h2>
      <p>Emitimos boleta electrónica conforme a normativa SII y la enviamos al correo ingresado.</p>

      <h2>9. Datos personales</h2>
      <p>Tratamiento de datos según <a href="/empresa/privacidad">Política de Privacidad</a>.</p>

      <h2>10. Limitación de responsabilidad</h2>
      <ul>
        <li>No respondemos por retrasos atribuibles al courier. Apoyamos el reclamo.</li>
        <li>La experiencia olfativa es subjetiva. No garantiza preferencia personal.</li>
      </ul>

      <h2>11. Jurisdicción</h2>
      <p>Tribunales de Viña del Mar, Chile.</p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TermsOfService",
            name: "Términos y Condiciones",
            provider: { "@type": "Organization", name: "Los Cáceres SpA" },
            inLanguage: "es-CL",
            dateModified: new Date().toISOString(),
            url: "https://tudominio.cl/empresa/terminos",
          }),
        }}
      />
    </main>
  );
}
