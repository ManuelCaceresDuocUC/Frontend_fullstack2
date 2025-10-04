// src/lib/webpay.ts
type CreateIn = { buyOrder: string; sessionId: string; amount: number; returnUrl: string };
type CreateOut = { url: string; token: string };
type CommitOut = { buyOrder: string; amount: number; status: "AUTHORIZED" | "FAILED" };

const MODE = (process.env.WEBPAY_MODE || "mock").toLowerCase(); // "mock" | "prod"

// --- MOCK ---
async function mockCreate(_input: CreateIn): Promise<CreateOut> {
  return { url: "https://webpay3g.transbank.cl", token: `mock_${Date.now()}` };
}
async function mockCommit(token: string): Promise<CommitOut> {
  return { buyOrder: token.replace(/^mock_/, ""), amount: 0, status: "AUTHORIZED" };
}

// --- PROD (implementa con SDK real) ---
async function prodCreate(_input: CreateIn): Promise<CreateOut> {
  // Ejemplo con SDK: const { token, url } = await tx.create(buyOrder, sessionId, amount, returnUrl)
  throw new Error("Implementa prodCreate con el SDK de Transbank");
}
async function prodCommit(_token: string): Promise<CommitOut> {
  // Ejemplo con SDK: const res = await tx.commit(token); response_code === 0 ? AUTHORIZED : FAILED
  throw new Error("Implementa prodCommit con el SDK de Transbank");
}

// Objeto unificado que algunos archivos esperan como `webpayTx`
export const webpayTx = {
  async create(input: CreateIn): Promise<CreateOut> {
    return MODE === "prod" ? prodCreate(input) : mockCreate(input);
  },
  async commit(token: string): Promise<CommitOut> {
    return MODE === "prod" ? prodCommit(token) : mockCommit(token);
  },
};

// Exports alternativos por si otros módulos consumen funciones sueltas
export const webpayCreate = (i: CreateIn) => webpayTx.create(i);
export const webpayCommit = (t: string) => webpayTx.commit(t);

export default webpayTx;
