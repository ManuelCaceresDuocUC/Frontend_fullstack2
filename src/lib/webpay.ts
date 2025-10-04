// src/lib/webpay.ts
const MODE = (process.env.WEBPAY_MODE || "mock").toLowerCase();

async function mockCreate(_: { buyOrder: string; sessionId: string; amount: number; returnUrl: string }) {
  const token = `mock_${Date.now()}`;
  const url = `${process.env.PUBLIC_BASE_URL}/pago/webpay/mock`; // ← local, no Transbank
  return { url, token };
}
async function mockCommit(token: string) {
  return { buyOrder: token.replace(/^mock_/, ""), amount: 0, status: "AUTHORIZED" as const };
}

export const webpayTx = {
  async create(i: { buyOrder: string; sessionId: string; amount: number; returnUrl: string }) {
    return MODE === "prod" ? /* prodCreate(i) */ Promise.reject(new Error("Implementa prod")) : mockCreate(i);
  },
  async commit(t: string) {
    return MODE === "prod" ? /* prodCommit(t) */ Promise.reject(new Error("Implementa prod")) : mockCommit(t);
  },
};
export default webpayTx;

