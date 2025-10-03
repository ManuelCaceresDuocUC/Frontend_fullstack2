import { NextResponse } from "next/server";

const CK = "cart_v1";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CK, "", { path: "/", maxAge: 0 });
  return res;
}
