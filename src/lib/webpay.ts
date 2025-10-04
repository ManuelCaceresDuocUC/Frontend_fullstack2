// src/lib/webpay.ts
import { WebpayPlus, Options, Environment, IntegrationApiKeys, IntegrationCommerceCodes } from "transbank-sdk";

const ENV = (process.env.TBK_ENV || process.env.WEBPAY_ENV || "integration").toLowerCase();
const IS_PROD = ENV === "prod" || ENV === "production";

function must(name: string) {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Falta ${name}`);
  return v;
}

const options = IS_PROD
  ? new Options(
      must("WEBPAY_COMMERCE_CODE") || must("TBK_COMMERCE_CODE"),
      must("WEBPAY_API_KEY") || must("TBK_API_KEY_SECRET"),
      Environment.Production
    )
  : new Options(
      IntegrationCommerceCodes.WEBPAY_PLUS,
      IntegrationApiKeys.WEBPAY,
      Environment.Integration
    );

export const webpayTx = new WebpayPlus.Transaction(options);
export const webpayCreate = (buyOrder: string, sessionId: string, amount: number, returnUrl: string) =>
  webpayTx.create(buyOrder, sessionId, amount, returnUrl);

export const webpayCommit = (token: string) => webpayTx.commit(token);
