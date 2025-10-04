// src/lib/webpay.ts
import {
  WebpayPlus,
  Options,
  Environment,
  IntegrationApiKeys,
  IntegrationCommerceCodes,
} from "transbank-sdk";

function env(k: string) {
  return process.env[k]?.trim();
}

const ENV_RAW = (env("TBK_ENV") || env("WEBPAY_ENV") || "integration").toLowerCase();
const IS_PROD = ENV_RAW === "prod" || ENV_RAW === "production";

const PROD_COMMERCE = env("WEBPAY_COMMERCE_CODE"); // requerido solo en prod
const PROD_API_KEY  = env("TBK_API_KEY_SECRET") || env("WEBPAY_API_KEY");

if (IS_PROD && (!PROD_COMMERCE || !PROD_API_KEY)) {
  throw new Error("Faltan WEBPAY_COMMERCE_CODE y/o TBK_API_KEY_SECRET para producción.");
}

const options = IS_PROD
  ? new Options(PROD_COMMERCE!, PROD_API_KEY!, Environment.Production)
  : new Options(
      IntegrationCommerceCodes.WEBPAY_PLUS,
      IntegrationApiKeys.WEBPAY,
      Environment.Integration
    );

export const webpayTx = new WebpayPlus.Transaction(options);

// helpers opcionales
export const webpayCreate = (buyOrder: string, sessionId: string, amount: number, returnUrl: string) =>
  webpayTx.create(buyOrder, sessionId, amount, returnUrl);

export const webpayCommit = (token: string) => webpayTx.commit(token);
