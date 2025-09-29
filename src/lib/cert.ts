import forge from "node-forge";

export function loadP12PEM() {
  const b64 = process.env.SII_CERT_P12_B64!;
  const pass = process.env.SII_CERT_PASSWORD!;
  const p12Der = forge.util.decode64(b64);
  const p12Asn1 = forge.asn1.fromDer(p12Der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, pass);

  let keyPem = "";
  let certPem = "";

  for (const safeContent of p12.safeContents) {
    for (const safeBag of safeContent.safeBags) {
      if (safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag || safeBag.type === forge.pki.oids.keyBag) {
        const key = safeBag.key as forge.pki.PrivateKey;
        keyPem = forge.pki.privateKeyToPem(key);
      }
      if (safeBag.type === forge.pki.oids.certBag) {
        const cert = safeBag.cert as forge.pki.Certificate;
        certPem = forge.pki.certificateToPem(cert);
      }
    }
  }
  if (!keyPem || !certPem) throw new Error("No se pudo extraer clave/cert del PFX");
  return { keyPem, certPem };
}
