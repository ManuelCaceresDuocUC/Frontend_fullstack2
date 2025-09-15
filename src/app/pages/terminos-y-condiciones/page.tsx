import React from "react";

export default function TerminosYCondicionesPage() {
  return (
    <main className=" pt-50" >
      <h1 className="font-bold text-3xl">Términos y Condiciones</h1>
      <p>
        Bienvenido a nuestra tienda de perfumería online. Al realizar una compra en nuestro sitio, aceptas los siguientes términos y condiciones:
      </p>
      <h2>1. Productos</h2>
      <p>
        Todos nuestros productos son originales y cuentan con garantía de calidad. Las imágenes son referenciales y pueden variar levemente respecto al producto recibido.
      </p>
      <h2>2. Precios y pagos</h2>
      <p>
        Los precios publicados incluyen IVA. Aceptamos pagos con tarjetas de crédito, débito y transferencias bancarias a través de plataformas seguras.
      </p>
      <h2>3. Despachos</h2>
      <p>
        Los despachos se realizan a la dirección indicada por el cliente. Los plazos y costos de envío están detallados en la sección de <a href="/pages/despachos">despachos</a>.
      </p>
      <h2>4. Cambios y devoluciones</h2>
      <p>
        Puedes solicitar cambios o devoluciones dentro de los 10 días siguientes a la recepción del producto, siempre que esté sin uso y en su empaque original. Para iniciar el proceso, contáctanos por WhatsApp o correo electrónico.
      </p>
      <h2>5. Reclamos</h2>
      <p>
        Si tienes algún reclamo, revisa la sección de <a href="/pages/reclamos">reclamos</a> para conocer el procedimiento y canales de contacto.
      </p>
      <h2>6. Privacidad</h2>
      <p>
        Tus datos personales serán utilizados solo para procesar tu compra y no serán compartidos con terceros.
      </p>
      <h2>7. Modificaciones</h2>
      <p>
        Nos reservamos el derecho de modificar estos términos y condiciones en cualquier momento. Los cambios serán publicados en esta página.
      </p>
    </main>
  );
}