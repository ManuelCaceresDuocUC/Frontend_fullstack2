// src/lib/dte.ts
import fs from "node:fs";
import path from "node:path";
import { create } from "xmlbuilder2";

/** ==================== CAF & Cert ===================== */

type Caf = {
  folioIni: number;
  folioFin: number;
  rsask: string;
  rsapk: string;
  rutEmisor: string;
  razon: string;
  xml: string;
};

// Lee CAF desde env B64; si no existe, desde PATH (solo local/dev).
export function loadCAF(tipo: 39 | 41): Caf {
  const b64 = tipo === 39 ? process.env.CAF_39_B64 : process.env.CAF_41_B64;
  let xml: string | undefined;

  if (b64 && b64.trim()) {
    xml = Buffer.from(b64, "base64").toString("utf8");
  } else {
    const p = tipo === 39 ? process.env.CAF_39_PATH : process.env.CAF_41_PATH;
    if (!p) throw new Error(`CAF_${tipo}_B64/CAF_${tipo}_PATH no configurado`);
    xml = fs.readFileSync(path.resolve(p), "utf8");
  }

  // parseo simple
  const folioIni = Number(xml.match(/<DA>[\s\S]*?<RNG>[\s\S]*?<D>(\d+)<\/D>/)![1]);
  const folioFin = Number(xml.match(/<DA>[\s\S]*?<RNG>[\s\S]*?<H>(\d+)<\/H>/)![1]);
  const rsask = xml.match(/<RSASK>([\s\S]*?)<\/RSASK>/)![1].trim();
  const rsapk = xml.match(/<RSAPK>([\s\S]*?)<\/RSAPK>/)![1].trim();
  const rutEmisor = xml.match(/<RE>([\s\S]*?)<\/RE>/)![1].trim();
  const razon = xml.match(/<RS>([\s\S]*?)<\/RS>/)![1].trim();
  return { folioIni, folioFin, rsask, rsapk, rutEmisor, razon, xml };
}

export function pickFolio(tipo: 39 | 41, used: number[]): number {
  const caf = loadCAF(tipo);
  for (let f = caf.folioIni; f <= caf.folioFin; f++) if (!used.includes(f)) return f;
  throw new Error("No quedan folios en CAF");
}

// Certificado PFX para firma (B64 primero; si no, PATH local)
export function loadCertPfx(): Buffer {
  const b64 = process.env.SII_CERT_P12_B64;
  if (b64 && b64.trim()) return Buffer.from(b64, "base64");
  const p = process.env.SII_CERT_P12_PATH;
  if (!p) throw new Error("SII_CERT_P12_B64/SII_CERT_P12_PATH no configurado");
  return fs.readFileSync(path.resolve(p));
}

/** ==================== Construcción DTE (sin firma) ===================== */

export function buildDTE({
  tipo,
  folio,
  emisor,
  receptor,
  items,
  fecha,
}: {
  tipo: 39 | 41;
  folio: number;
  emisor: { rut: string; rz: string; giro: string; dir: string; cmna: string };
  receptor?: { rut?: string; rz?: string };
  items: Array<{ nombre: string; qty: number; precioNeto: number; exento?: boolean }>;
  fecha: string; // YYYY-MM-DD
}) {
  const neto = Math.round(items.filter(i => !i.exento).reduce((a, i) => a + i.qty * i.precioNeto, 0));
  const iva = Math.round(neto * 0.19);
  const total = neto + iva + items.filter(i => i.exento).reduce((a, i) => a + i.qty * i.precioNeto, 0);

  const root = create({ version: "1.0", encoding: "ISO-8859-1" })
    .ele("DTE", { version: "1.0" })
    .ele("Documento", { ID: `R${folio}` })
    .ele("Encabezado")
    .ele("IdDoc")
    .ele("TipoDTE").txt(String(tipo)).up()
    .ele("Folio").txt(String(folio)).up()
    .ele("FchEmis").txt(fecha).up()
    .up()
    .ele("Emisor")
    .ele("RUTEmisor").txt(emisor.rut).up()
    .ele("RznSoc").txt(emisor.rz).up()
    .ele("GiroEmis").txt(emisor.giro).up()
    .ele("DirOrigen").txt(emisor.dir).up()
    .ele("CmnaOrigen").txt(emisor.cmna).up()
    .up()
    .ele("Receptor")
    .ele("RUTRecep").txt(receptor?.rut ?? "66666666-6").up()
    .ele("RznSocRecep").txt(receptor?.rz ?? "Cliente").up()
    .up()
    .ele("Totales")
    .ele("MntNeto").txt(String(neto)).up()
    .ele("IVA").txt(String(iva)).up()
    .ele("MntTotal").txt(String(total)).up()
    .up()
    .up();

  items.forEach((it, idx) => {
    const det = root.ele("Detalle");
    det.ele("NroLinDet").txt(String(idx + 1)).up();
    det.ele("NmbItem").txt(it.nombre).up();
    det.ele("QtyItem").txt(String(it.qty)).up();
    if (it.exento) det.ele("IndExe").txt("1").up();
    det.ele("PrcItem").txt(String(it.precioNeto)).up();
    det.up();
  });

  const xml = root.up().up().end({ prettyPrint: true });
  return { xml, neto, iva, total };
}

/** ==================== SOAP SII (esqueleto) ===================== */
// URLs de certificación
const SII_CERT = {
  CR_SEED: "https://maullin.sii.cl/DTEWS/CrSeed.jws",
  GET_TOKEN: "https://maullin.sii.cl/DTEWS/GetTokenFromSeed.jws",
  ENVIO_DTE: "https://maullin.sii.cl/DTEWS/EnvioDTE.jws",
};

// POST SOAP simple
async function soapPost(url: string, soapAction: string, bodyXml: string) {
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=ISO-8859-1",
      SOAPAction: soapAction,
    },
    body: bodyXml,
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`SOAP ${soapAction} ${r.status}: ${text}`);
  return text;
}

// Extrae nodo por regex
function pick(xml: string, tag: string) {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  if (!m) throw new Error(`No <${tag}> en SOAP`);
  return m[1].trim();
}

/** ============ Token (CrSeed + firma de semilla) ============= */

// TODO: implementar firma XML-DSig real de la semilla con tu PFX.
// Por ahora retorna un envoltorio no firmado para mantener el flujo.
function signSeedXML(semilla: string): string {
  return `<getToken><item><![CDATA[<Semilla>${semilla}</Semilla>]]></item></getToken>`;
}

export async function getToken(): Promise<string> {
  // 1) CrSeed
  const req1 = `<?xml version="1.0" encoding="ISO-8859-1"?>
  <SII:SolicitaToken xmlns:SII="http://www.sii.cl/XMLSchema">
    <SII:inn:SolicitudToken xmlns:SII:inn="http://www.sii.cl/XMLSchema">
      <SII:inn:NombreCertificado>dummy</SII:inn:NombreCertificado>
    </SII:inn:SolicitudToken>
  </SII:SolicitaToken>`;
  const respSeed = await soapPost(SII_CERT.CR_SEED, "urn:CrSeed", req1);
  const semilla = pick(respSeed, "SEMILLA");

  // 2) Firma Semilla -> getTokenFromSeed
  const signed = signSeedXML(semilla);
  const req2 = `<?xml version="1.0" encoding="ISO-8859-1"?>
  <SII:getTokenFromSeed xmlns:SII="http://www.sii.cl/XMLSchema">
    ${signed}
  </SII:getTokenFromSeed>`;
  const respTok = await soapPost(SII_CERT.GET_TOKEN, "urn:getTokenFromSeed", req2);

  // Si firmas bien, aquí devuelve <TOKEN>real...</TOKEN>.
  const token = pick(respTok, "TOKEN");
  return token;
}

/** =============== Envío DTE (sobre + firma) ================== */

// Construye Sobre con SetDTE (sin firma digital aún)
function buildSobreEnvio(dteXml: string): string {
  const now = new Date().toISOString().slice(0, 19);
  return `<?xml version="1.0" encoding="ISO-8859-1"?>
  <EnvioDTE xmlns="http://www.sii.cl/SiiDte" version="1.0">
    <SetDTE ID="SetDoc">
      <Caratula version="1.0">
        <RutEmisor>${process.env.BILLING_RUT}</RutEmisor>
        <RutEnvia>${process.env.BILLING_RUT}</RutEnvia>
        <RutReceptor>60803000-K</RutReceptor>
        <FchResol>2014-01-01</FchResol>
        <NroResol>0</NroResol>
        <TmstFirmaEnv>${now}</TmstFirmaEnv>
        <SubTotDTE>
          <TpoDTE>39</TpoDTE><NroDTE>1</NroDTE>
        </SubTotDTE>
      </Caratula>
      ${dteXml}
    </SetDTE>
  </EnvioDTE>`;
}

// TODO: firmar XML del EnvioDTE con tu certificado (XML-DSig)
// Mientras tanto, devuelve el mismo XML para mantener el flujo.
function signSobreXML(xmlSobre: string): string {
  return xmlSobre;
}

export async function sendEnvioDTE(xmlDte: string, token: string) {
  const sobre = buildSobreEnvio(xmlDte);
  const firmado = signSobreXML(sobre);

  const soap = `<?xml version="1.0" encoding="ISO-8859-1"?>
  <SII:EnviarDTE xmlns:SII="http://www.sii.cl/XMLSchema">
    <SII:token>${token}</SII:token>
    <SII:archivo><![CDATA[${firmado}]]></SII:archivo>
  </SII:EnviarDTE>`;

  const resp = await soapPost(SII_CERT.ENVIO_DTE, "urn:EnviarDTE", soap);
  const trackid = pick(resp, "TRACKID"); // con firma/token reales, SII responde un trackid real
  return { trackid };
}
