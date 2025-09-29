// src/lib/cert.ts
// mTLS LAZY para fetch + extracción de key/cert PEM desde .p12 (SII Certificación)

import fs from "fs";
import path from "path";
import * as forge from "node-forge";
import { Agent, setGlobalDispatcher, getGlobalDispatcher } from "undici";

// --- helpers env ---
function must(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Falta variable de entorno ${name}`);
  return v.trim();
}

// .p12 desde B64 o PATH
function loadP12Buffer(): Buffer {
  const b64 = process.env.SII_CERT_P12_B64?.trim();
  if (b64) return Buffer.from(b64, "base64");
  const p = must("SII_CERT_P12_PATH");
  return fs.readFileSync(path.resolve(p));
}

// Buffer(Node) -> ByteBuffer(forge) (sin 'binary' string)
function bufferToForge(buf: Buffer) {
  return forge.util.createBuffer(new Uint8Array(buf));
}

// Extrae { keyPem, certPem } desde .p12 (para firmar XML)
export function loadP12PEM(): { keyPem: string; certPem: string } {
  const pass = must("SII_CERT_PASSWORD");
  const p12buf = loadP12Buffer();

  const p12Asn1 = forge.asn1.fromDer(bufferToForge(p12buf));
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, pass);

  let keyPem = "";
  let certPem = "";

  for (const sc of p12.safeContents) {
    for (const sb of sc.safeBags) {
      if (sb.type === forge.pki.oids.pkcs8ShroudedKeyBag || sb.type === forge.pki.oids.keyBag) {
        keyPem = forge.pki.privateKeyToPem(sb.key!);
      }
      if (sb.type === forge.pki.oids.certBag) {
        certPem = forge.pki.certificateToPem(sb.cert!);
      }
    }
  }

  if (!keyPem || !certPem) throw new Error("No se pudo extraer key/cert del .p12");
  return { keyPem, certPem };
}

// Configura mTLS GLOBAL de forma perezosa. Llamar dentro del handler.
export function ensureMtlsDispatcher(): void {
  // si ya hay dispatcher global, no tocar
  try {
    const existing = getGlobalDispatcher?.();
    if (existing) return;
  } catch {
    // continúa y configura
  }

  const agent = new Agent({
    connect: {
      pfx: loadP12Buffer(),
      passphrase: must("SII_CERT_PASSWORD"),
      rejectUnauthorized: true,
    },
  });
  setGlobalDispatcher(agent);
}
