import fs from "node:fs";
import path from "node:path";
import { create } from "xmlbuilder2";
import { DOMParser as XP } from "@xmldom/xmldom";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { SignedXml } = require("xml-crypto");
import { loadP12Pem, ensureMtlsDispatcher } from "@/lib/cert";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import crypto from "node:crypto";

function sanitizeXmlForLog(xml: string) {
  return xml
    .replace(/(<(?:ds:)?X509Certificate>)[\s\S]*?(<\/(?:ds:)?X509Certificate>)/g, "$1[...recortado...]$2")
    .replace(/(<SignatureValue>)[\s\S]*?(<\/SignatureValue>)/g, "$1[...recortado...]$2");
}
function forcePlainKeyInfo(signedXml: string, certB64: string): string {
  // 1) Borra cualquier KeyInfo existente (con o sin prefijo)
  let xml = signedXml
    .replace(/<ds:KeyInfo[\s\S]*?<\/ds:KeyInfo>/g, "")
    .replace(/<KeyInfo[\s\S]*?<\/KeyInfo>/g, "");

  // 2) Inserta KeyInfo SIN prefijos justo antes de cerrar la firma (ds:Signature o Signature)
  const keyInfo =
    `<KeyInfo><X509Data><X509Certificate>${certB64}</X509Certificate></X509Data></KeyInfo>`;

  if (/(<\/ds:Signature>\s*)$/i.test(xml)) {
    xml = xml.replace(/(<\/ds:Signature>\s*)$/i, `${keyInfo}$1`);
  } else if (/(<\/Signature>\s*)$/i.test(xml)) {
    xml = xml.replace(/(<\/Signature>\s*)$/i, `${keyInfo}$1`);
  } else {
    // fallback: después de SignatureValue, dentro de la firma
    xml = xml.replace(/(<\/(?:ds:)?SignatureValue>\s*)/i, `$1${keyInfo}`);
  }
  return xml;
}


/** ========== DOM en Node ========== */
type DomGlobals = { DOMParser?: typeof DOMParser; XMLSerializer?: typeof XMLSerializer };
const g = globalThis as unknown as DomGlobals;
g.DOMParser ??= DOMParser;
g.XMLSerializer ??= XMLSerializer;

/** ========== CAF & Cert ========== */
type Caf = {
  folioIni: number; folioFin: number;
  rsask: string; rsapk: string;
  rutEmisor: string; razon: string; xml: string;
};

export function loadCAF(tipo: 39 | 41): Caf {
  const b64 = tipo === 39 ? process.env.CAF_39_B64 : process.env.CAF_41_B64;
  let xml: string | undefined;

  if (b64 && b64.trim()) xml = Buffer.from(b64, "base64").toString("latin1");
  else {
    const p = tipo === 39 ? process.env.CAF_39_PATH : process.env.CAF_41_PATH;
    if (!p) throw new Error(`CAF_${tipo}_B64/CAF_${tipo}_PATH no configurado`);
    xml = fs.readFileSync(path.resolve(p), "latin1");
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

/** ========== Construcción DTE (sin firma) ========== */
export function buildDTE({
  tipo, folio, emisor, receptor, items, fecha,
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

/** ========== TED (timbraje con CAF) + Firma Documento ========== */
type DteHead = {
  RE: string; TD: number; F: number; FE: string; RR: string; RSR: string; MNT: number; IT1: string;
};

function buildDDXML(cafXml: string, head: DteHead, ts: string): string {
  // Extrae solo el elemento <CAF> del XML completo
  const cafOnly = cafXml.match(/<CAF[\s\S]*<\/CAF>/)![0];

  // Crea DD y sus hijos
  const dd = create({ version: "1.0", encoding: "ISO-8859-1" }).ele("DD");
  dd.ele("RE").txt(head.RE).up()
    .ele("TD").txt(String(head.TD)).up()
    .ele("F").txt(String(head.F)).up()
    .ele("FE").txt(head.FE).up()
    .ele("RR").txt(head.RR).up()
    .ele("RSR").txt(head.RSR).up()
    .ele("MNT").txt(String(head.MNT)).up()
    .ele("IT1").txt(head.IT1.slice(0, 40)).up();

  // Importa el <CAF> como nodo, sin escaparlo
  const cafNode = create(cafOnly).root();
  dd.import(cafNode);

  // TSTED
  dd.ele("TSTED").txt(ts).up();

  return dd.up().end({ headless: true });
}


function signDDwithRSASK(ddXml: string, rsaskPem: string): string {
  const signer = crypto.createSign("RSA-SHA1");
  signer.update(Buffer.from(ddXml, "latin1"));
  return signer.sign(rsaskPem).toString("base64");
}

function injectTEDandTmst(dteXml: string, tedXml: string, ts: string): string {
  return dteXml.replace(
    /<\/Encabezado>\s*<\/Documento>/,
    `</Encabezado>\n${tedXml}\n<TmstFirma>${ts}</TmstFirma>\n</Documento>`
  );
}
function addRefById(
   sig: {
     addReference: (opts: {
       xpath: string;
       transforms: string[];
       digestAlgorithm: string;
       uri: string;
     }) => void;
   },
  id: string
 ) {
  const xpath = `//*[@Id='${id}' or @ID='${id}']`;
  sig.addReference({
    xpath,
    transforms: [
      "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
      "http://www.w3.org/2001/10/xml-exc-c14n#",
    ],
    digestAlgorithm: "http://www.w3.org/2000/09/xmldsig#sha1",
    uri: `#${id}`,
  });
}

function signXmlEnveloped(xml: string, idToSign: string): string {
  const { keyPem, certPem } = loadP12Pem();
  if (!keyPem?.includes("BEGIN") || !certPem?.includes("BEGIN")) {
    throw new Error("Certificado o clave inválidos desde loadP12Pem()");
  }
  const certB64 = certPem.replace(/-----(BEGIN|END) CERTIFICATE-----|\s/g, "");

  const sig = new SignedXml({
    idAttribute: "Id",
    signingKey: keyPem,
    privateKey: keyPem,
    signatureAlgorithm: "http://www.w3.org/2000/09/xmldsig#rsa-sha1",
    canonicalizationAlgorithm: "http://www.w3.org/2001/10/xml-exc-c14n#",
    signatureNamespacePrefix: "ds",
  });

  sig.keyInfoProvider = {
    getKeyInfo: () =>
      `<ds:X509Data xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
         <ds:X509Certificate>${certB64}</ds:X509Certificate>
       </ds:X509Data>`
  };

  const xpath = `//*[@Id='${idToSign}' or @ID='${idToSign}']`;
  if (!new RegExp(`\\b(Id|ID)="${idToSign}"`).test(xml)) {
    throw new Error(`Nodo a firmar sin Id="${idToSign}"`);
  }

  addRefById(sig, idToSign);

  sig.computeSignature(xml, { location: { reference: xpath, action: "append" } });
let signed = sig.getSignedXml();

// Fuerza KeyInfo plano para SII
signed = forcePlainKeyInfo(signed, certB64);

return signed;
}




function signDocumento(dteXml: string): string {
  const m = dteXml.match(/<Documento[^>]*\bID="([^"]+)"/i);
  if (!m) throw new Error("Documento sin ID");
  const docId = m[1];
  return signXmlEnveloped(dteXml, docId);
}

/** Timbrar + firmar Documento con CAF */
export function stampDTEWithCAF(dteXml: string, caf: Caf): string {
  const TD = Number(dteXml.match(/<TipoDTE>(\d+)<\/TipoDTE>/)![1]);
  const F  = Number(dteXml.match(/<Folio>(\d+)<\/Folio>/)![1]);
  const FE = dteXml.match(/<FchEmis>([^<]+)<\/FchEmis>/)![1];
  const RE = dteXml.match(/<RUTEmisor>([^<]+)<\/RUTEmisor>/)![1];
  const RR = dteXml.match(/<RUTRecep>([^<]+)<\/RUTRecep>/)![1];
  const RSR= dteXml.match(/<RznSocRecep>([^<]+)<\/RznSocRecep>/)![1];
  const MNT= Number(dteXml.match(/<MntTotal>(\d+)<\/MntTotal>/)![1]);
  const IT1= dteXml.match(/<NmbItem>([^<]+)<\/NmbItem>/)![1];

  const ts = new Date().toISOString().replace("T"," ").slice(0,19);
  const ddXml = buildDDXML(caf.xml, { RE, TD, F, FE, RR, RSR, MNT, IT1 }, ts);
  const frmtB64 = signDDwithRSASK(ddXml, caf.rsask);
  const tedXml = `<TED version="1.0"><DD>${ddXml}</DD><FRMT algoritmo="SHA1withRSA">${frmtB64}</FRMT></TED>`;

  const withTED = injectTEDandTmst(dteXml, tedXml, ts);
  return signDocumento(withTED);
}

/** ========== SOAP SII ========== */
const SII_ENV = (process.env.SII_ENV || "cert").toLowerCase();
const BASE = SII_ENV === "prod" ? "https://maullin.sii.cl" : "https://palena.sii.cl";

const soapEnv = (inner: string) =>
  `<?xml version="1.0" encoding="ISO-8859-1"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body>${inner}</soapenv:Body></soapenv:Envelope>`;

function hasClientCert() {
  return !!process.env.SII_CERT_P12_B64 || !!process.env.SII_CERT_P12_PATH;
}

async function postSOAP(
  p: string,
  body: string,
  extraHeaders?: Readonly<Record<string, string>>,
): Promise<string> {
  if (hasClientCert()) ensureMtlsDispatcher();
  const url = `${BASE}${p}`;
  const headers: Record<string, string> = {
    "Content-Type": "text/xml; charset=ISO-8859-1",
    Accept: "text/xml,application/xml,text/plain",
    SOAPAction: "",
    ...(extraHeaders ?? {}),
  };

  const res = await fetch(url, { method: "POST", headers, body: Buffer.from(body, "latin1") });
  const txt = await res.text();
  if (!res.ok) throw new Error(`SOAP ${p} ${res.status}: ${txt.slice(0, 400)}`);
  return txt;
}

const pick = (xml: string, tag: string): string => {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
  if (!m) throw new Error(`No <${tag}> en respuesta`);
  return m[1].trim();
};

/** ========== Seed + Token ========== */
export async function getSeed(): Promise<string> {
  const env = soapEnv(`<getSeed/>`);
  const resp = await postSOAP(`/DTEWS/CrSeed.jws`, env);

  const doc = new XP().parseFromString(resp, "text/xml");
  // Busca cualquier prefijo: ns:getSeedReturn, getSeedReturn, etc.
  const nodes = Array.from(doc.getElementsByTagName("*"));
  const ret = nodes.find(n => n.localName === "getSeedReturn");
  if (!ret || !ret.textContent) throw new Error(`No <getSeedReturn> en respuesta. Head: ${resp.slice(0, 200)}`);

  // Decodifica entidades (&lt;SEMILLA>…)
  const decoded = ret.textContent
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  const m = decoded.match(/<SEMILLA>([^<]+)<\/SEMILLA>/i);
  if (!m) throw new Error(`No <SEMILLA> en respuesta decodificada. Head: ${decoded.slice(0, 200)}`);
  return m[1].trim();
}


function buildSeedXML(seed: string): string {
  return `<getToken xmlns="http://www.sii.cl/SiiDte" ID="GT" Id="GT"><item><Semilla>${seed}</Semilla></item></getToken>`;
}

function stripXmlDecl(s: string) { return s.replace(/^\s*<\?xml[^?]*\?>\s*/i, ""); }

async function getTokenFromSeed(signedXml: string): Promise<string> {
  const inner = stripXmlDecl(signedXml);
  const env = soapEnv(
    `<SII:getToken xmlns:SII="http://www.sii.cl/SiiDte"><pszXml><![CDATA[${inner}]]></pszXml></SII:getToken>`
  );

  if (process.env.DTE_DEBUG === "1") {
    const safe = sanitizeXmlForLog(inner);
    console.log("\n=== pszXml firmado (getToken) ===\n" + safe + "\n=== fin ===\n");
    try { fs.writeFileSync("/tmp/getToken.signed.xml", inner, "latin1"); } catch {}
  }

  const resp = await postSOAP(`/DTEWS/GetTokenFromSeed.jws`, env);

  const doc = new XP().parseFromString(resp, "text/xml");
  const nodes = Array.from(doc.getElementsByTagName("*"));
  const ret = nodes.find(n => n.localName === "getTokenReturn");
  if (!ret || !ret.textContent)
    throw new Error(`No <getTokenReturn> en respuesta. Head: ${resp.slice(0, 400)}`);

  const decoded = ret.textContent.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  const mTok = decoded.match(/<TOKEN>([^<]+)<\/TOKEN>/i);
  if (!mTok)
    throw new Error(`No <TOKEN> en respuesta decodificada. Head: ${decoded.slice(0, 400)}`);
  return mTok[1].trim();
}

export async function getToken(): Promise<string> {
  const hasCert = !!process.env.SII_CERT_P12_B64 || !!process.env.SII_CERT_P12_PATH;
  const hasPass = !!process.env.SII_CERT_PASSWORD;
  if (!hasCert || !hasPass) return "TOKEN_FAKE_CERT";
  const seed = await getSeed();
  const seedXml = buildSeedXML(seed);
  const signed = signXmlEnveloped(seedXml, "GT");
  return await getTokenFromSeed(signed);
}

/** ========== Envío DTE (Sobre) ========== */
function buildSobreEnvio(dteXml: string): string {
  const now = new Date().toISOString().slice(0, 19);
  return `<?xml version="1.0" encoding="ISO-8859-1"?>
<EnvioDTE xmlns="http://www.sii.cl/SiiDte" version="1.0" ID="ENV" Id="ENV">
  <SetDTE ID="SetDoc" Id="SetDoc">
    <Caratula version="1.0">
      <RutEmisor>${process.env.BILLING_RUT}</RutEmisor>
      <RutEnvia>${process.env.SII_RUT_ENVIA}</RutEnvia>
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

function signSobre(xmlSobre: string): string {
  return signXmlEnveloped(xmlSobre, "ENV");
}

export async function sendEnvioDTE(xmlDte: string, token: string) {
  const firmado = signSobre(buildSobreEnvio(xmlDte));
  const env = soapEnv(
    `<upload><fileName>SetDTE.xml</fileName><contentFile><![CDATA[${firmado}]]></contentFile></upload>`
  );
  const txt = await postSOAP(`/DTEWS/EnvioDTE.jws`, env, { Cookie: `TOKEN=${token}` });
  const trackid = pick(txt, "TRACKID");
  return { trackid };
}
