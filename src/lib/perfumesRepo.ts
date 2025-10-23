// src/lib/perfumesRepo.ts
export type Perfume = { id: string; nombre: string; ml: number; precio: number; disponible: boolean };
export async function listPerfumes(): Promise<Perfume[]> { return []; }
export async function addPerfume(p: Omit<Perfume,'id'>): Promise<Perfume> { return { id: 'tmp', ...p }; }
