// src/lib/webpay.ts
const MODE = (process.env.TBK_ENV || "mock").toLowerCase();

export type InitInput = { buyOrder: string; sessionId: string; amount: number; returnUrl: string };
export type InitResp  = { url: string; token: string };
export type CommitResp = { buyOrder: string; amount: number; status: "AUTHORIZED" | "FAILED" };

// MOCK
async function mockCreate(i: InitInput): Promise<InitResp> {
  const token = `mock_${Date.now()}`;
  const url = `/pago/webpay/mock?return=${encodeURIComponent(i.returnUrl)}&token_ws=${encodeURIComponent(token)}`;
  return { url, token };
}
async function mockCommit(_token: string): Promise<CommitResp> {
  return { buyOrder: "mock", amount: 0, status: "AUTHORIZED" };
}

// PROD (stub)
async function prodCreate(_: InitInput): Promise<InitResp> { throw new Error("Implementa Webpay prod"); }
async function prodCommit(_: string): Promise<CommitResp> { throw new Error("Implementa Webpay prod"); }

export const webpayTx = {
  create: (i: InitInput) => (MODE === "prod" ? prodCreate(i) : mockCreate(i)),
  commit: (t: string) => (MODE === "prod" ? prodCommit(t) : mockCommit(t)),
};
export default webpayTx;
