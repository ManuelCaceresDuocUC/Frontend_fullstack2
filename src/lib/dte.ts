// src/lib/dte.ts
import fs from "node:fs";
import path from "node:path";
import { create } from "xmlbuilder2";
import { SignedXml } from "xml-crypto";
import { loadP12PEM } from "./cert";
import { loadP12KeyAndCert } from "./cert"; 
import { ensureMtlsDispatcher } from "@/lib/cert";

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
type LegacySignedXml = SignedXml & {
  signingKey: string | Buffer;
  keyInfoProvider: { getKeyInfo: () => string };
};
function withKey(sig: SignedXml, certB64: string, key: import("crypto").KeyObject) {
  const sxa = sig as unknown as {
    signingKey?: unknown; key?: unknown; privateKey?: unknown;
    keyInfoProvider?: { getKeyInfo: () => string };
  };

  // setea en TODOS los nombres usados por distintas versiones
  sxa.signingKey = key;
  sxa.key = key;
  sxa.privateKey = key;

  sxa.keyInfoProvider = {
    getKeyInfo: () => `<X509Data><X509Certificate>${certB64}</X509Certificate></X509Data>`,
  };
}

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

/** ==================== SOAP SII ===================== */

const SII_ENV = (process.env.SII_ENV || "cert").toLowerCase();
const BASE = SII_ENV === "prod" ? "https://maullin.sii.cl" : "https://palena.sii.cl";

const soapEnv = (inner: string) =>
  `<?xml version="1.0" encoding="ISO-8859-1"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body>${inner}</soapenv:Body></soapenv:Envelope>`;

async function postSOAP(path: string, body: string): Promise<string> {
  ensureMtlsDispatcher();
  const url = `${BASE}${path}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=ISO-8859-1",
      "Accept": "text/xml,application/xml,text/plain",
      "SOAPAction": "",
    },
    body: Buffer.from(body, "latin1"),
  });

  const txt = await res.text();
  // debug dentro de la función, usando "res", no "r"
  console.error("[SII SOAP]", path, "status:", res.status, "len:", txt.length, "head:", txt.slice(0, 200));

  if (!res.ok) throw new Error(`SOAP ${path} ${res.status}: ${txt.slice(0, 400)}`);
  return txt;
}

const pick = (xml: string, tag: string): string => {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
  if (!m) throw new Error(`No <${tag}> en respuesta`);
  return m[1].trim();
};

/** ============ Seed + Token ============ */

// 1) Decodifica getSeedReturn escapado
export async function getSeed(): Promise<string> {
  const env = soapEnv(`<getSeed/>`);
  const resp = await postSOAP(`/DTEWS/CrSeed.jws`, env);

  const inner = resp.match(/<getSeedReturn[^>]*>([\s\S]*?)<\/getSeedReturn>/i);
  if (!inner) throw new Error(`No <getSeedReturn> en respuesta. Head: ${resp.slice(0,400)}`);

  const decoded = inner[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  const m = decoded.match(/<SEMILLA>([^<]+)<\/SEMILLA>/i);
  if (!m) throw new Error(`No <SEMILLA> en respuesta decodificada. Head: ${decoded.slice(0,200)}`);
  return m[1].trim();
}


function buildSeedXML(seed: string): string {
  return `<getToken xmlns="http://www.sii.cl/SiiDte"><item><Semilla>${seed}</Semilla></item></getToken>`;
}

// Firma del getToken (seed)
// firma seed
function signXmlEnveloped(xml: string): string {
  const { key, certPem } = loadP12KeyAndCert();
  const certB64 = certPem.replace(/-----(BEGIN|END) CERTIFICATE-----|\s/g, "");

  const sig = new SignedXml({
    canonicalizationAlgorithm: "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
    signatureAlgorithm: "http://www.w3.org/2000/09/xmldsig#rsa-sha1",
  });

  withKey(sig, certB64, key);
  sig.addReference({
    xpath: "//*[local-name(.)='getToken']",
    transforms: [
      "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
      "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
    ],
    digestAlgorithm: "http://www.w3.org/2000/09/xmldsig#sha1",
  });

  sig.computeSignature(xml);
  return sig.getSignedXml();
}

function stripXmlDecl(s: string) {
  return s.replace(/^\s*<\?xml[^?]*\?>\s*/i, "");
}

async function getTokenFromSeed(signedXml: string): Promise<string> {
  const inner = stripXmlDecl(signedXml);
  const ns = (process.env.SII_ENV || "cert").toLowerCase() === "prod"
    ? "https://maullin.sii.cl/DTEWS/GetTokenFromSeed.jws"
    : "https://palena.sii.cl/DTEWS/GetTokenFromSeed.jws";

  const env = soapEnv(
    `<m:getToken xmlns:m="${ns}"><pszXml><![CDATA[${inner}]]></pszXml></m:getToken>`
  );

  const resp = await postSOAP(`/DTEWS/GetTokenFromSeed.jws`, env);

  const mRet = resp.match(/<(?:\w+:)?getTokenReturn[^>]*>([\s\S]*?)<\/(?:\w+:)?getTokenReturn>/i);
  if (!mRet) throw new Error(`No <getTokenReturn> en respuesta. Head: ${resp.slice(0,400)}`);

  const decoded = mRet[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  const mTok = decoded.match(/<TOKEN>([^<]+)<\/TOKEN>/i);
  if (!mTok) throw new Error(`No <TOKEN> en respuesta decodificada. Head: ${decoded.slice(0,200)}`);
  return mTok[1].trim();
}




export async function getToken(): Promise<string> {
  const hasCert = !!process.env.SII_CERT_P12_B64 || !!process.env.SII_CERT_P12_PATH;
  const hasPass = !!process.env.SII_CERT_PASSWORD;
  if (!hasCert || !hasPass) return "TOKEN_FAKE_CERT";

  const seed = await getSeed();
  const seedXml = buildSeedXML(seed);
  const signed = signXmlEnveloped(seedXml);
  const token = await getTokenFromSeed(signed);
  return token;
}

/** ============ Envío DTE (Sobre) ============ */

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
      <SubTotDTE><TpoDTE>39</TpoDTE><NroDTE>1</NroDTE></SubTotDTE>
    </Caratula>
    ${dteXml}
  </SetDTE>
</EnvioDTE>`;
}

// Firma del Sobre EnvioDTE
// firma sobre EnvioDTE

function signSobreXML(xmlSobre: string): string {
  const { key, certPem } = loadP12KeyAndCert();
  const certB64 = certPem.replace(/-----(BEGIN|END) CERTIFICATE-----|\s/g, "");

  const sig = new SignedXml({
    canonicalizationAlgorithm: "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
    signatureAlgorithm: "http://www.w3.org/2000/09/xmldsig#rsa-sha1",
  });

  withKey(sig, certB64, key);
  sig.addReference({
    xpath: "/*[local-name(.)='EnvioDTE']",
    transforms: [
      "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
      "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
    ],
    digestAlgorithm: "http://www.w3.org/2000/09/xmldsig#sha1",
  });

  sig.computeSignature(xmlSobre);
  return sig.getSignedXml();
}


export async function sendEnvioDTE(xmlDte: string, token: string) {
  const sobre = buildSobreEnvio(xmlDte);
  const firmado = signSobreXML(sobre);

  const env = soapEnv(
    `<upload><fileName>SetDTE.xml</fileName><contentFile><![CDATA[${firmado}]]></contentFile></upload>`
  );

  const r = await fetch(`${BASE}/DTEWS/EnvioDTE.jws`, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=ISO-8859-1",
      "Accept": "text/xml,application/xml,text/plain",
      "SOAPAction": "",
      "Cookie": `TOKEN=${token}`,
    },
    body: env,
  });
  const txt = await r.text();
  console.error("[SII SOAP] /EnvioDTE status:", r.status, "len:", txt.length, "head:", txt.slice(0, 200));
  if (!r.ok) throw new Error(`SOAP EnvioDTE ${r.status}: ${txt.slice(0, 400)}`);
  const trackid = pick(txt, "TRACKID");
  return { trackid };
}
