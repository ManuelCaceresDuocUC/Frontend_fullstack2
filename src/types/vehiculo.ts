export interface Vehiculo {
  id: string;
  userEmail?: string;
  marca: string;
  modelo: string;
  anio: number;
  precio: number;
  tipo: string;
  combustible: string;
  transmision: string;
  imagen: string;
  imagenes?: string[];
  creadoEn?: string;
}
