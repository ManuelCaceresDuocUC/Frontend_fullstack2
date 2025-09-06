"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function FinanciamientoPage() {
  return (
    <main className="pt-28 md:pt-36 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* HERO */}
      <section className="px-6 md:px-16 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl md:text-6xl font-extrabold"
        >
          Financiamiento
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mt-3 text-lg md:text-2xl text-white/90"
        >
          Opciones vigentes en Chile y qué mirar antes de firmar.
        </motion.p>
      </section>

      {/* ALTERNATIVAS */}
      <section className="px-6 md:px-16 max-w-7xl mx-auto mt-10 grid gap-6 md:grid-cols-2">
        <Card
          title="Crédito automotriz tradicional"
          bullets={[
            "Pie usual 10–30%. Plazos comunes 12–60 meses.",
            "El vehículo suele quedar en prenda (garantía).",
            "Costos claves: CAE y Costo Total del Crédito (CTC).",
          ]}
        />
        <Card
          title="Crédito automotriz con cuota final (“inteligente”)"
          bullets={[
            "Cuotas bajas + cuota balón al final (Valor Futuro Mínimo Garantizado).",
            "Al final: pagar el cuotón, refinanciarlo o renovar vehículo.",
            "Revisa bien el CTC total si planeas refinanciar el cuotón.",
          ]}
        />
        <Card
          title="Crédito de consumo"
          bullets={[
            "Recibes efectivo y compras el auto al contado.",
            "No siempre requiere prenda sobre el vehículo.",
            "Compara CAE y comisiones vs. crédito automotriz.",
          ]}
        />
        <Card
          title="Leasing financiero (con opción de compra)"
          bullets={[
            "Arriendo con opción de compra al final del contrato.",
            "La propiedad es de la financiera hasta el ejercicio de la opción.",
            "Usado por personas y empresas para autos nuevos o usados.",
          ]}
        />
        <Card
          title="Leasing operativo (empresas)"
          bullets={[
            "Arriendo de flota por 12+ meses, con mantenciones incluidas.",
            "Sin opción de compra en la mayoría de los contratos.",
            "Enfocado en gestión y costos operativos.",
          ]}
        />
      </section>

      {/* QUÉ REVISAR SIEMPRE */}
      <section className="px-6 md:px-16 max-w-7xl mx-auto mt-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Qué revisar siempre</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <KeyBox
            title="CAE (Carga Anual Equivalente)"
            body="Porcentaje que resume el costo del crédito e incluye intereses, comisiones y seguros asociados. Úsalo para comparar ofertas equivalentes."
            link={{ href: "https://www.sernac.cl/proteccion-al-consumidor/consumidor-financiero/la-carga-anual-equivalente/", label: "Ver CAE (SERNAC)" }}
          />
          <KeyBox
            title="CTC (Costo Total del Crédito)"
            body="Monto total que pagarás por el financiamiento en todo el plazo. Debe estar informado en la cotización/hoja resumen."
            link={{ href: "https://www.sernac.cl/portal/618/w3-propertyvalue-66843.html", label: "Tus derechos al contratar (SERNAC)" }}
          />
          <KeyBox
            title="Tasa Máxima Convencional (TMC)"
            body="Límite legal para intereses. La publica la CMF por segmentos de monto y plazo. Sirve para detectar tasas fuera de norma."
            link={{ href: "https://www.cmfchile.cl/educa/600/w3-propertyvalue-1188.html", label: "Interés Máximo Convencional (CMF)" }}
          />
          <KeyBox
            title="Seguros y venta atada"
            body="En créditos de consumo/automotriz los seguros asociados no pueden imponerse como ‘obligatorios’ con un proveedor específico. Puedes cotizar y elegir."
            link={{ href: "https://www.sernac.cl/derechos-del-consumidor-financiero/", label: "Derechos del consumidor financiero (SERNAC)" }}
          />
          <KeyBox
            title="Prenda sin desplazamiento"
            body="Garantía usual en créditos automotrices. El auto queda en prenda hasta pagar. Se inscribe en el Registro de Prendas sin Desplazamiento."
            link={{ href: "https://www.chileatiende.gob.cl/fichas/4686-inscripcion-en-el-registro-de-prendas-sin-desplazamiento", label: "Registro de Prendas (ChileAtiende)" }}
          />
          <KeyBox
            title="Hoja resumen y cotización"
            body="Debes recibir por escrito condiciones, CAE, CTC, comisiones y seguros. Guarda esa cotización: es parte de lo ofrecido."
            link={{ href: "https://www.sernac.cl/portal/618/w3-propertyvalue-66843.html", label: "Hoja resumen (SERNAC)" }}
          />
        </div>
      </section>

      {/* REQUISITOS TÍPICOS */}
      <section className="px-6 md:px-16 max-w-7xl mx-auto mt-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Requisitos típicos</h2>
        <ul className="space-y-2 text-white/90">
          <li>• Cédula vigente y antecedentes de ingresos (liquidaciones, IVA o boletas).</li>
          <li>• Antigüedad laboral o de actividad independiente según política del proveedor.</li>
          <li>• Pie cuando aplique, historial crediticio acorde al monto y plazo.</li>
          <li>• En leasing o crédito con prenda: tasación y documentación del vehículo.</li>
        </ul>
        <p className="mt-3 text-sm text-white/70">
          Tip: solicita al menos 3 cotizaciones comparables por monto y plazo iguales.
        </p>
      </section>

      {/* FAQ RÁPIDA */}
      <section className="px-6 md:px-16 max-w-7xl mx-auto mt-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Preguntas rápidas</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Faq q="¿Hay seguros obligatorios por ley en un crédito automotriz?">
            No. Para créditos de consumo/automotriz no hay seguros obligatorios por ley. Si te exigen cobertura, puedes contratarla con el proveedor que elijas.
          </Faq>
          <Faq q="¿Pueden subirme la tasa al firmar?">
            No deberían cambiar condiciones ofrecidas y documentadas en la cotización/hoja resumen sin tu consentimiento. Exige copia y compárala con el contrato.
          </Faq>
          <Faq q="¿Qué pasa si adelanto cuotas?">
            Deben informarte la liquidación total o parcial a tu requerimiento. El cálculo y comisiones deben estar en el contrato.
          </Faq>
          <Faq q="¿El crédito de consumo es mejor que el automotriz?">
            Depende de CAE, CTC, plazo y garantías. Compara al menos tres ofertas con el mismo monto y plazo. Decide por costo total y flexibilidad.
          </Faq>
        </div>
      </section>

      {/* ENLACES OFICIALES */}
      <section className="px-6 md:px-16 max-w-7xl mx-auto mt-12 mb-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Enlaces oficiales útiles</h2>
        <ul className="list-disc pl-6 space-y-2 text-white/90">
          <li><A href="https://www.sernac.cl/proteccion-al-consumidor/consumidor-financiero/la-carga-anual-equivalente/">CAE explicada (SERNAC)</A></li>
          <li><A href="https://www.cmfchile.cl/educa/600/w3-propertyvalue-1188.html">Interés Máximo Convencional (CMF)</A></li>
          <li><A href="https://www.sernac.cl/derechos-del-consumidor-financiero/">Derechos del consumidor financiero (SERNAC)</A></li>
          <li><A href="https://www.chileatiende.gob.cl/fichas/4686-inscripcion-en-el-registro-de-prendas-sin-desplazamiento">Registro de Prendas sin Desplazamiento (ChileAtiende)</A></li>
          <li><A href="https://www.cmfchile.cl/educa/600/w3-article-27148.html">¿Qué es el leasing? (CMF Educa)</A></li>
        </ul>

        <p className="mt-6 text-xs text-white/60">
          Esta página es informativa y no constituye asesoría. Verifica tasas, CAE y condiciones vigentes con cada proveedor antes de contratar.
        </p>
      </section>
    </main>
  );
}

/* ---------- UI helpers ---------- */

function Card({ title, bullets }: { title: string; bullets: string[] }) {
  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur p-5 border border-white/10">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <ul className="space-y-2 text-white/90">
        {bullets.map((b, i) => <li key={i}>• {b}</li>)}
      </ul>
    </div>
  );
}

function KeyBox({
  title,
  body,
  link,
}: {
  title: string;
  body: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur p-5 border border-white/10">
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-white/90">{body}</p>
      {link && (
        <Link href={link.href} target="_blank" className="inline-block mt-3 underline text-white/80 hover:text-white">
          {link.label}
        </Link>
      )}
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur p-5 border border-white/10">
      <h3 className="text-lg font-semibold mb-1">{q}</h3>
      <p className="text-white/90">{children}</p>
    </div>
  );
}

function A(props: React.ComponentProps<"a">) {
  return <a {...props} className="underline text-white/80 hover:text-white" target="_blank" />;
}
