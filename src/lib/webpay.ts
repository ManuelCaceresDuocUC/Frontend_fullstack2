// src/lib/webpay.ts
import { WebpayPlus, Options, Environment, IntegrationApiKeys, IntegrationCommerceCodes } from "transbank-sdk";

function env(key: string) {
  return process.env[key]?.trim();
}

// Permite WEBPAY_* y también TBK_* como fallback
const ENV_RAW = (env("WEBPAY_ENV") || env("TBK_ENV") || "integration").toLowerCase();
const IS_PROD = ENV_RAW === "prod" || ENV_RAW === "production";

const PROD_COMMERCE = env("WEBPAY_COMMERCE_CODE") || env("TBK_COMMERCE_CODE");
const PROD_API_KEY  = env("WEBPAY_API_KEY")       || env("TBK_API_KEY_SECRET");

const options = IS_PROD
  ? new Options(
      // Producción: debes usar tu código y secret reales
      assertVar(PROD_COMMERCE, "WEBPAY_COMMERCE_CODE/TBK_COMMERCE_CODE"),
      assertVar(PROD_API_KEY,  "WEBPAY_API_KEY/TBK_API_KEY_SECRET"),
      Environment.Production
    )
  : new Options(
      // Integración oficial
      IntegrationCommerceCodes.WEBPAY_PLUS,
      IntegrationApiKeys.WEBPAY,
      Environment.Integration
    );

function assertVar<T>(v: T | undefined, name: string): T {
  if (!v) throw new Error(`Falta la variable de entorno ${name} para Webpay (producción).`);
  return v;
}

export const webpayTx = new WebpayPlus.Transaction(options);
