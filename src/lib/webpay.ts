// src/lib/webpay.ts
// Wrapper simple con modo mock para probar redirección.
// En producción, reemplaza implementaciones usando el SDK oficial de Transbank.

type CreateIn = { buyOrder: string; sessionId: string; amount: number; returnUrl: string };
type CreateOut = { url: string; token: string };
type CommitOut = { buyOrder: string; amount: number; status: "AUTHORIZED" | "FAILED" };

const MODE = (process.env.WEBPAY_MODE || "mock").toLowerCase(); // "mock" | "prod"

// MOCK: redirige a sitio de Webpay y “autoriza” siempre
async function mockCreate(_: CreateIn): Promise<CreateOut> {
  return {
    url: "https://webpay3g.transbank.cl",
    token: `mock_${Date.now()}`,
  };
}
async function mockCommit(token: string): Promise<CommitOut> {
  return { buyOrder: token.replace(/^mock_/, ""), amount: 0, status: "AUTHORIZED" };
}

// PROD: aquí debes usar el SDK real
// Ejemplo de firma (ajústalo a tu lib):
// import { WebpayPlus, Options, Environment } from "transbank-sdk";
// const tx = new WebpayPlus.Transaction(new Options(commerceCode, apiKey, env));
async function prodCreate(input: CreateIn): Promise<CreateOut> {
  // TODO: Implementa con SDK real:
  // const { token, url } = await tx.create(input.buyOrder, input.sessionId, input.amount, input.returnUrl);
  // return { url, token };
  throw new Error("Implementa webpay.ts prodCreate con el SDK de Transbank");
}
async function prodCommit(token: string): Promise<CommitOut> {
  // TODO: Implementa con SDK real:
  // const res = await tx.commit(token);
  // const status = res.response_code === 0 ? "AUTHORIZED" : "FAILED";
  // return { buyOrder: res.buy_order, amount: res.amount, status };
  throw new Error("Implementa webpay.ts prodCommit con el SDK de Transbank");
}

export async function webpayCreate(input: CreateIn): Promise<CreateOut> {
  return MODE === "prod" ? prodCreate(input) : mockCreate(input);
}
export async function webpayCommit(token: string): Promise<CommitOut> {
  return MODE === "prod" ? prodCommit(token) : mockCommit(token);
}
