// src/lib/dte.ts
import fs from "node:fs";
import path from "node:path";
import forge from "node-forge";
import { create } from "xmlbuilder2";

type Caf = { folioIni: number; folioFin: number; rsask: string; rsapk: string; // claves CAF
  rutEmisor: string; razon: string; // meta
  xml: string; };

export function loadCAF(tipo: 39|41): Caf {
  const p = tipo === 39 ? process.env.CAF_39_PATH! : process.env.CAF_41_PATH!;
  const xml = fs.readFileSync(path.resolve(p), "utf8");
  // parseo simple (sin depender de XPath)
  const folioIni = Number(xml.match(/<DA>[\s\S]*?<RNG>[\s\S]*?<D>(\d+)<\/D>/)![1]);
  const folioFin = Number(xml.match(/<DA>[\s\S]*?<RNG>[\s\S]*?<H>(\d+)<\/H>/)![1]);
  const rsask    = xml.match(/<RSASK>([\s\S]*?)<\/RSASK>/)![1].trim();
  const rsapk    = xml.match(/<RSAPK>([\s\S]*?)<\/RSAPK>/)![1].trim();
  const rutEmisor= xml.match(/<RE>([\s\S]*?)<\/RE>/)![1].trim();
  const razon    = xml.match(/<RS>([\s\S]*?)<\/RS>/)![1].trim();
  return { folioIni, folioFin, rsask, rsapk, rutEmisor, razon, xml };
}

export function pickFolio(tipo: 39|41, used: number[]): number {
  const caf = loadCAF(tipo);
  for (let f=caf.folioIni; f<=caf.folioFin; f++) if (!used.includes(f)) return f;
  throw new Error("No quedan folios en CAF");
}

// Construye DTE básico (afecto) con 1..n ítems
export function buildDTE({ tipo, folio, emisor, receptor, items, fecha }:{
  tipo: 39|41; folio:number;
  emisor:{rut:string; rz:string; giro:string; dir:string; cmna:string};
  receptor?:{rut?:string; rz?:string};
  items: Array<{nombre:string; qty:number; precioNeto:number; exento?:boolean}>;
  fecha: string; // YYYY-MM-DD
}) {
  // totales
  const neto = Math.round(items.filter(i=>!i.exento).reduce((a,i)=>a + i.qty*i.precioNeto,0));
  const iva  = Math.round(neto*0.19);
  const total= neto + iva + items.filter(i=>i.exento).reduce((a,i)=>a + i.qty*i.precioNeto,0);

  const root = create({ version:"1.0", encoding:"ISO-8859-1" })
    .ele("DTE",{version:"1.0"})
      .ele("Documento",{ID:`R${folio}`})
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

  items.forEach((it, idx)=>{
    const det = root.ele("Detalle");
    det.ele("NroLinDet").txt(String(idx+1)).up();
    det.ele("NmbItem").txt(it.nombre).up();
    det.ele("QtyItem").txt(String(it.qty)).up();
    if (it.exento) det.ele("IndExe").txt("1").up(); // exento
    det.ele("PrcItem").txt(String(it.precioNeto)).up();
    det.up();
  });

  const xml = root.up().up().end({ prettyPrint:true });
  return { xml, neto, iva, total };
}

// Firma seed, obtiene token y envía — stubs para conectar luego
export async function getToken(): Promise<string> {
  // TODO: implementar flujo CrSeed → sign → GetTokenFromSeed (SOAP)
  return "TOKEN_FAKE_CERT";
}
export async function sendEnvioDTE(_xmlEnvioFirmado: string, _token: string) {
  // TODO: POST SOAP al endpoint de certificación; devolver trackid
  return { trackid: "123456" };
}

// PDF417 (TED) y firma XML completa: lo iteramos en la siguiente fase
