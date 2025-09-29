// src/lib/cert.ts
// mTLS LAZY para fetch + extracción de key/cert PEM desde .p12 (SII Certificación)

import fs from "fs";
import path from "path";
import * as forge from "node-forge";
import { Agent, setGlobalDispatcher, getGlobalDispatcher } from "undici";
import { createPrivateKey, KeyObject } from "crypto";

// --- helpers env ---
function must(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Falta variable de entorno ${name}`);
  return v.trim();
}
export function loadP12KeyAndCert(): { key: KeyObject; keyPem: string; certPem: string } {
  const { keyPem: rawKeyPem, certPem } = loadP12PEM(); // certPem es const
  const keyPem = rawKeyPem.replace(/\r/g, "");         // normaliza CRLF
  const key = createPrivateKey({ key: keyPem });
  return { key, keyPem, certPem };
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

// Tipos auxiliares attrs
type Pkcs12Attr = { name: string; value?: unknown };
type BagAttrs = { attributes?: Pkcs12Attr[] | { localKeyId?: Array<{ value?: unknown }> } };
type BagWithKey = forge.pkcs12.Bag & { key?: forge.pki.PrivateKey } & BagAttrs;
type BagWithCert = forge.pkcs12.Bag & { cert?: forge.pki.Certificate } & BagAttrs;

function isBagWithKey(bag: forge.pkcs12.Bag): bag is BagWithKey {
  return Object.prototype.hasOwnProperty.call(bag, "key");
}
function isBagWithCert(bag: forge.pkcs12.Bag): bag is BagWithCert {
  return Object.prototype.hasOwnProperty.call(bag, "cert");
}

// localKeyId -> hex (soporta arreglo u objeto)
function getLocalKeyIdHex(bag: forge.pkcs12.Bag): string | undefined {
  const attrsRaw = (bag as BagAttrs).attributes;
  if (!attrsRaw) return undefined;

  let bb: forge.util.ByteBuffer | undefined;

  if (Array.isArray(attrsRaw)) {
    const hit = (attrsRaw as Pkcs12Attr[]).find((a: Pkcs12Attr) => a.name === "localKeyId");
    if (hit && hit.value && typeof hit.value === "object") bb = hit.value as forge.util.ByteBuffer;
  } else if (typeof attrsRaw === "object" && attrsRaw !== null) {
    const first = (attrsRaw as { localKeyId?: Array<{ value?: unknown }> }).localKeyId?.[0]?.value;
    if (first && typeof first === "object") bb = first as forge.util.ByteBuffer;
  }
  if (!bb || typeof bb.getBytes !== "function") return undefined;

  const bytes = bb.getBytes();
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += ("0" + bytes.charCodeAt(i).toString(16)).slice(-2);
  return hex;
}

// Devuelve PEMs emparejados. Clave en PEM (PKCS#8 o RSA PKCS#1), ambos válidos para xml-crypto.
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
        const pk = bag.key;
        const pem = forge.pki.privateKeyToPem(pk).trim(); // "-----BEGIN PRIVATE KEY-----"
        keys.push({ pem, id });
      }
      if (isBagWithCert(bag) && bag.cert) {
        certs.push({ pem: forge.pki.certificateToPem(bag.cert).trim(), id });
      }
    }
  }

  let keyPem = "";
  let certPem = "";

  // Empareja por localKeyId
  for (const c of certs) {
    const k = keys.find((kk) => c.id && kk.id && kk.id === c.id);
    if (k) { keyPem = k.pem; certPem = c.pem; break; }
  }
  if (!keyPem && keys.length) keyPem = keys[0].pem;
  if (!certPem && certs.length) certPem = certs[0].pem;

  if (!keyPem) throw new Error("No se encontró la clave privada en el .p12");
  if (!certPem) throw new Error("No se encontró el certificado en el .p12");

  // Validaciones mínimas
  if (!/^-----BEGIN (?:RSA )?PRIVATE KEY-----/.test(keyPem)) {
    throw new Error("Clave privada PEM inválida");
  }
  if (!/^-----BEGIN CERTIFICATE-----/.test(certPem)) {
    throw new Error("Certificado PEM inválido");
  }

  return { keyPem, certPem };
}

// mTLS global para fetch (llamar dentro del handler)
export function ensureMtlsDispatcher(): void {
  try {
    const existing = getGlobalDispatcher?.();
    if (existing) return;
  } catch { /* noop */ }

  const agent = new Agent({
    connect: {
      pfx: loadP12Buffer(),
      passphrase: must("SII_CERT_PASSWORD"),
      rejectUnauthorized: true,
    },
  });
  setGlobalDispatcher(agent);
}
