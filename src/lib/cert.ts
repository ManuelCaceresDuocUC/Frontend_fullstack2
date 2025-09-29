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

// Buffer(Node) -> ByteBuffer(forge)
function bufferToForge(buf: Buffer): forge.util.ByteBuffer {
  return forge.util.createBuffer(new Uint8Array(buf));
}

// Tipos auxiliares para atributos sin depender de tipos inexistentes en @types/node-forge
type Pkcs12Attr = { name: string; value?: unknown };
type BagWithAttrs = forge.pkcs12.Bag & { attributes?: Pkcs12Attr[] };
type BagWithKey = forge.pkcs12.Bag & { key?: forge.pki.PrivateKey };
type BagWithCert = forge.pkcs12.Bag & { cert?: forge.pki.Certificate };

// type guards
function isBagWithKey(bag: forge.pkcs12.Bag): bag is BagWithKey {
  return Object.prototype.hasOwnProperty.call(bag, "key") && Boolean((bag as BagWithKey).key);
}
function isBagWithCert(bag: forge.pkcs12.Bag): bag is BagWithCert {
  return Object.prototype.hasOwnProperty.call(bag, "cert") && Boolean((bag as BagWithCert).cert);
}

// attr localKeyId -> hex
// attr localKeyId -> hex
function getLocalKeyIdHex(bag: forge.pkcs12.Bag): string | undefined {
  const attrs = (bag as BagWithAttrs).attributes;
  if (!attrs) return undefined;

  const raw = (attrs.find((a: Pkcs12Attr) => a.name === "localKeyId")?.value);
  if (!raw) return undefined;

  // Esperamos forge.util.ByteBuffer
  if (typeof raw !== "object" || raw === null) return undefined;
  const bb = raw as forge.util.ByteBuffer;
  if (typeof bb.getBytes !== "function") return undefined;

  const bytes = bb.getBytes();
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += ("0" + bytes.charCodeAt(i).toString(16)).slice(-2);
  return hex;
}


// Extrae { keyPem, certPem } emparejados por localKeyId
export function loadP12PEM(): { keyPem: string; certPem: string } {
  const pass = must("SII_CERT_PASSWORD");
  const p12buf = loadP12Buffer();

  const p12Asn1 = forge.asn1.fromDer(bufferToForge(p12buf));
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, pass);

  const keys: Array<{ pem: string; id?: string }> = [];
  const certs: Array<{ pem: string; id?: string }> = [];

  for (const sc of p12.safeContents) {
    for (const bag of sc.safeBags) {
      const id = getLocalKeyIdHex(bag);

      if (isBagWithKey(bag) && bag.key) {
        keys.push({ pem: forge.pki.privateKeyToPem(bag.key), id });
      }
      if (isBagWithCert(bag) && bag.cert) {
        certs.push({ pem: forge.pki.certificateToPem(bag.cert), id });
      }
    }
  }

  let keyPem = "";
  let certPem = "";

  // empareja por localKeyId
  for (const c of certs) {
    const k = keys.find(kk => c.id && kk.id && kk.id === c.id);
    if (k) { keyPem = k.pem; certPem = c.pem; break; }
  }
  // fallback
  if (!keyPem && keys.length) keyPem = keys[0].pem;
  if (!certPem && certs.length) certPem = certs[0].pem;

  if (!keyPem) throw new Error("No se encontró la clave privada en el .p12");
  if (!certPem) throw new Error("No se encontró el certificado en el .p12");

  if (!/^-----BEGIN (RSA )?PRIVATE KEY-----/.test(keyPem.trim())) {
    throw new Error("Clave privada en formato no soportado");
  }
  if (!/^-----BEGIN CERTIFICATE-----/.test(certPem.trim())) {
    throw new Error("Certificado en formato PEM inválido");
  }

  return { keyPem: keyPem.trim(), certPem: certPem.trim() };
}

// Configura mTLS GLOBAL de forma perezosa. Llamar dentro del handler.
export function ensureMtlsDispatcher(): void {
  try {
    const existing = getGlobalDispatcher?.();
    if (existing) return;
  } catch {
    /* noop */
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
