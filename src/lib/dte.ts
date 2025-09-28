// src/lib/dte.ts
import fs from "node:fs";
import path from "node:path";
import { create } from "xmlbuilder2";

type Caf = {
  folioIni: number;
  folioFin: number;
  rsask: string;
  rsapk: string;
  rutEmisor: string;
  razon: string;
  xml: string;
};

// Lee CAF desde env B64; si no existe, desde PATH (solo local/dev)
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

// Construcción DTE básica (sin TED/firma aún)
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
  const total =
    neto + iva + items.filter(i => i.exento).reduce((a, i) => a + i.qty * i.precioNeto, 0);

  const root = create({ version: "1.0", encoding: "ISO-8859-1" })
    .ele("DTE", { version: "1.0" })
    .ele("Documento", { ID: `R${folio}` })
    .ele("Encabezado")
    .ele("IdDoc")
    .ele("TipoDTE")
    .txt(String(tipo))
    .up()
    .ele("Folio")
    .txt(String(folio))
    .up()
    .ele("FchEmis")
    .txt(fecha)
    .up()
    .up()
    .ele("Emisor")
    .ele("RUTEmisor")
    .txt(emisor.rut)
    .up()
    .ele("RznSoc")
    .txt(emisor.rz)
    .up()
    .ele("GiroEmis")
    .txt(emisor.giro)
    .up()
    .ele("DirOrigen")
    .txt(emisor.dir)
    .up()
    .ele("CmnaOrigen")
    .txt(emisor.cmna)
    .up()
    .up()
    .ele("Receptor")
    .ele("RUTRecep")
    .txt(receptor?.rut ?? "66666666-6")
    .up()
    .ele("RznSocRecep")
    .txt(receptor?.rz ?? "Cliente")
    .up()
    .up()
    .ele("Totales")
    .ele("MntNeto")
    .txt(String(neto))
    .up()
    .ele("IVA")
    .txt(String(iva))
    .up()
    .ele("MntTotal")
    .txt(String(total))
    .up()
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

// Stubs SII (se implementan luego)
export async function getToken(): Promise<string> {
  return "TOKEN_FAKE_CERT";
}
export async function sendEnvioDTE(_xmlEnvioFirmado: string, _token: string) {
  return { trackid: "123456" };
}
