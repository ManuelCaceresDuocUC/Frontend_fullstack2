// src/lib/webpay.ts
import {
  WebpayPlus,
  Options,
  Environment,
  IntegrationApiKeys,
  IntegrationCommerceCodes,
} from "transbank-sdk";

// Usa integración por defecto; solo usa prod si TODO está configurado
const isProd = process.env.WEBPAY_ENV === "production"
  && !!process.env.WEBPAY_COMMERCE_CODE
  && !!process.env.WEBPAY_API_KEY;

const options = isProd
  ? new Options(
      process.env.WEBPAY_COMMERCE_CODE!, // entregado por Transbank
      process.env.WEBPAY_API_KEY!,       // entregado por Transbank
      Environment.Production
    )
  : new Options(
      IntegrationCommerceCodes.WEBPAY_PLUS, // 597055555532
      IntegrationApiKeys.WEBPAY,            // api key de integración
      Environment.Integration
    );

export const webpayTx = new WebpayPlus.Transaction(options);
