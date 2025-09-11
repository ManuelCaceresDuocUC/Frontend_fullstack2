import type { Vehiculo } from "@/types/vehiculo";

// Usa S3 si está definido, si no cae a /public/gallery
const BASE = (process.env.NEXT_PUBLIC_S3_BASE ?? "").replace(/\/+$/, "");
const p = (x: string) => (BASE ? `${BASE}/perfumes/demo/${x}` : `/gallery/${x}`);
export const SEED_VEHICULOS: Vehiculo[] = [
  { id: "1", marca: "Toyota",   modelo: "RAV4",   anio: 2021, precio: 17990000, tipo: "suv",         combustible: "gasolina",  transmision: "automatica", imagen: p("1.jpg"),  imagenes: [p("1.jpg")] },
  { id: "2", marca: "Hyundai",  modelo: "Tucson", anio: 2020, precio: 16490000, tipo: "suv",         combustible: "diesel",    transmision: "automatica", imagen: p("2.jpg"),  imagenes: [p("2.jpg")] },
  { id: "3", marca: "Kia",      modelo: "Rio 5",  anio: 2019, precio:  7490000, tipo: "hatchback",   combustible: "gasolina",  transmision: "manual",     imagen: p("3.jpeg"), imagenes: [p("3.jpeg")] },
  { id: "4", marca: "Chevrolet",modelo: "Sail",   anio: 2018, precio:  5890000, tipo: "sedan",       combustible: "gasolina",  transmision: "manual",     imagen: p("4.webp"), imagenes: [p("4.webp")] },
  { id: "5", marca: "Ford",     modelo: "Ranger", anio: 2022, precio: 22990000, tipo: "pickup",      combustible: "diesel",    transmision: "manual",     imagen: p("5.jpg"),  imagenes: [p("5.jpg")] },
  { id: "6", marca: "Suzuki",   modelo: "Swift",  anio: 2021, precio:  8990000, tipo: "hatchback",   combustible: "gasolina",  transmision: "cvt",        imagen: p("6.webp"), imagenes: [p("6.webp")] },
  { id: "7", marca: "Nissan",   modelo: "X-Trail",anio: 2022, precio: 19990000, tipo: "suv",         combustible: "hibrido",   transmision: "cvt",        imagen: p("7.jpeg"), imagenes: [p("7.jpeg")] },
  { id: "8", marca: "BYD",      modelo: "Han",    anio: 2023, precio: 32990000, tipo: "sedan",       combustible: "electrico", transmision: "automatica", imagen: p("8.webp"), imagenes: [p("8.webp")] },
  { id: "9", marca: "Toyota",   modelo: "RAV4",   anio: 2021, precio: 17990000, tipo: "suv",         combustible: "gasolina",  transmision: "automatica", imagen: p("1.jpg"),  imagenes: [p("1.jpg")] },
  { id: "10",marca: "Yamaha",   modelo: "R3",     anio: 2022, precio:  4290000, tipo: "motocicleta", combustible: "gasolina",  transmision: "manual",     imagen: p("10.jpg"), imagenes: [p("10.jpg")] },
];
