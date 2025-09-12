// src/lib/webpay.ts
import {
  WebpayPlus,
  Options,
  IntegrationApiKeys,
  IntegrationCommerceCodes,
  Environment,
} from "transbank-sdk";

const ENV = (process.env.WEBPAY_ENV ?? "INTEGRATION").toUpperCase();
const commerce = process.env.WEBPAY_COMMERCE_CODE ?? IntegrationCommerceCodes.WEBPAY_PLUS;
const apiKey = process.env.WEBPAY_API_KEY ?? IntegrationApiKeys.WEBPAY;

const options =
  ENV === "PRODUCTION"
    ? new Options(commerce, apiKey, Environment.Production)
    : new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration);

export const webpayTx = new WebpayPlus.Transaction(options);
