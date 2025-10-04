// src/lib/webpay.ts
const MODE = (process.env.WEBPAY_MODE || "mock").toLowerCase();

// MOCK: ignora returnUrl y usa ruta local
async function mockCreate(_: { buyOrder: string; sessionId: string; amount: number; returnUrl: string }) {
  const token = `mock_${Date.now()}`;
  return { url: "/pago/webpay/mock", token }; // ← relativo, sin PUBLIC_BASE_URL
}
async function mockCommit(token: string) {
  return { buyOrder: token.replace(/^mock_/, ""), amount: 0, status: "AUTHORIZED" as const };
}

// TODO: implementar prod con SDK real
async function prodCreate(_input: { buyOrder: string; sessionId: string; amount: number; returnUrl: string }) {
  throw new Error("Implementa Webpay prod");
}
async function prodCommit(_token: string) {
  throw new Error("Implementa Webpay prod");
}

export const webpayTx = {
  create: (i: { buyOrder: string; sessionId: string; amount: number; returnUrl: string }) =>
    MODE === "prod" ? prodCreate(i) : mockCreate(i),
  commit: (t: string) => (MODE === "prod" ? prodCommit(t) : mockCommit(t)),
};
export default webpayTx;
