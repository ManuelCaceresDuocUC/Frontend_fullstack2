import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Vehiculo = {
  id: string;
  userEmail?: string;
  marca: string;
  modelo: string;
  anio: number;
  precio: number;
  tipo: string;
  combustible: string;
  transmision: string;
  imagen: string; // primera imagen
};

const DATA_PATH = path.join(process.cwd(), "data", "vehiculos.json");
const GALLERY_DIR = path.join(process.cwd(), "public", "gallery");

async function readAll(): Promise<Vehiculo[]> {
  try { return JSON.parse(await fs.readFile(DATA_PATH, "utf8")); }
  catch { return []; }
}
async function writeAll(list: Vehiculo[]) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(list, null, 2));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mine = url.searchParams.get("mine");
  const session = await getServerSession(authOptions);
  const all = await readAll();
  const out = mine && session?.user?.email
    ? all.filter(v => v.userEmail === session.user!.email)
    : all;
  return NextResponse.json(out);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const form = await req.formData();
  const required = ["marca","modelo","anio","precio","tipo","combustible","transmision"];
  for (const k of required) {
    if (!form.get(k)) return NextResponse.json({ error: `Falta ${k}` }, { status: 400 });
  }

  await fs.mkdir(GALLERY_DIR, { recursive: true });

  const files = form.getAll("imagenes") as File[];
  const imagePaths: string[] = [];

  for (const f of files) {
    if (!f || typeof f === "string") continue;
    if (!["image/jpeg","image/png","image/webp","image/avif"].includes(f.type)) continue;
    const ext = (f.type.split("/")[1] || "jpg").toLowerCase();
    const name = `${crypto.randomBytes(16).toString("hex")}.${ext}`;
    const filepath = path.join(GALLERY_DIR, name);
    const buffer = Buffer.from(await f.arrayBuffer());
    await fs.writeFile(filepath, buffer);
    imagePaths.push("/gallery/" + name);
  }

  const nuevo: Vehiculo = {
    id: crypto.randomUUID(),
    userEmail: session.user.email!,
    marca: String(form.get("marca")),
    modelo: String(form.get("modelo")),
    anio: Number(form.get("anio")),
    precio: Number(form.get("precio")),
    tipo: String(form.get("tipo")),
    combustible: String(form.get("combustible")),
    transmision: String(form.get("transmision")),
    imagen: imagePaths[0] ?? "/gallery/placeholder.jpg",
  };

  const all = await readAll();
  all.push(nuevo);
  await writeAll(all);

  return NextResponse.json({ ok: true, vehiculo: nuevo });
}
