import React from "react";

export default function ReclamosPage() {
  return (
    <main className=" pt-50" >
      <h1 className="text-3xl font-bold">Reclamos y Contacto</h1>
      <p>
        Si tienes algún inconveniente con tu pedido, producto o despacho, por favor contáctanos para ayudarte a resolverlo.
      </p>
      <h2>¿Cómo hacer un reclamo?</h2>
      <ol>
        <li>Escríbenos a nuestro WhatsApp: <a href="https://wa.me/56912345678" target="_blank" rel="noopener">+56 9 1234 5678</a></li>
        <li>Indica tu número de pedido y el motivo del reclamo.</li>
        <li>Te responderemos lo antes posible para darte una solución.</li>
      </ol>
      <p>
        También puedes escribirnos a nuestro correo: <a href="mailto:contacto@perfumeria.cl">contacto@perfumeria.cl</a>
      </p>
      <p>
        Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00 hrs.
      </p>
    </main>
  );
}