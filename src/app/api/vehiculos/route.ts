import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import type { Vehiculo } from "@/types/vehiculo";
import { SEED_VEHICULOS } from "@/data/vehiculos.seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export const GET = () => NextResponse.json({ error: "gone" }, { status: 410 });
export const POST = () => NextResponse.json({ error: "gone" }, { status: 410 });
export const DELETE = () => NextResponse.json({ error: "gone" }, { status: 410 });



const DATA_PATH = path.join(process.cwd(), "data", "vehiculos.json");
const GALLERY_DIR = path.join(process.cwd(), "public", "gallery");

function mergeSeed(persisted: Vehiculo[]): Vehiculo[] {
  const map = new Map<string, Vehiculo>();
  SEED_VEHICULOS.forEach((v: Vehiculo) => map.set(String(v.id), v));   // tipa v
  persisted.forEach((v: Vehiculo) => map.set(String(v.id), v));        // tipa v
  return [...map.values()];
}

async function readAll(): Promise<Vehiculo[]> {
  try {
    const raw = JSON.parse(await fs.readFile(DATA_PATH, "utf8")) as Partial<Vehiculo>[];
    let changed = false;

    const list: Vehiculo[] = raw.map((r) => {
      if (!r.id) { r.id = crypto.randomUUID(); changed = true; }
      return {
        id: r.id!,
        userEmail: typeof r.userEmail === "string" ? r.userEmail : undefined,
        marca: String(r.marca ?? "N/D"),
        modelo: String(r.modelo ?? "N/D"),
        anio: Number(r.anio ?? 0),
        precio: Number(r.precio ?? 0),
        tipo: String(r.tipo ?? "suv"),
        combustible: String(r.combustible ?? "gasolina"),
        transmision: String(r.transmision ?? "manual"),
        imagen: typeof r.imagen === "string" ? r.imagen : "/gallery/placeholder.jpg",
        imagenes: Array.isArray(r.imagenes) ? r.imagenes : (r.imagen ? [r.imagen] : []),
        creadoEn: typeof r.creadoEn === "string" ? r.creadoEn : undefined,
      };
    });

    if (changed) await writeAll(list);
    return list;
  } catch {
    return [];
  }
}

async function writeAll(list: Vehiculo[]) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(list, null, 2));
}



