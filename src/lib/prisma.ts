import { PrismaClient, Prisma, type Perfume } from "@prisma/client";
import { computeVariantPrice, marginForMl, round990Up } from "./pricing";

declare global { var __PRISMA__: PrismaClient | undefined; }

const base = global.__PRISMA__ ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global.__PRISMA__ = base;

// Cliente crudo para transacciones
export const db = base;

type PerfumeUSDProps = {
  bottleMl?: number | null;
  bottleOz?: number | null;
  priceUsd?: number | null;
  labelleUsd?: number | null;
  importFactor?: number | null;
  exchangeRate?: number | null;
};
const OZ_TO_ML = 29.5735;

function bottleMlFrom(p: Perfume & Partial<PerfumeUSDProps>): number {
  if (p.bottleMl && p.bottleMl > 0) return p.bottleMl;
  if (p.bottleOz && p.bottleOz > 0) return p.bottleOz * OZ_TO_ML;
  return p.ml;
}
function priceForVariant(perfume: Perfume & Partial<PerfumeUSDProps>, ml: number): number | null {
  const usd = Number(perfume.priceUsd ?? perfume.labelleUsd ?? 0);
  const bmlAll = bottleMlFrom(perfume);
  if (usd > 0 && bmlAll > 0) {
    return computeVariantPrice({
      priceUsd: usd,
      bottleMl: bmlAll,
      ml,
      importFactor: perfume.importFactor ?? null,
      exchangeRate: perfume.exchangeRate ?? null,
    });
  }
  if (perfume.price > 0 && perfume.ml > 0) {
    const costPerMl = perfume.price / perfume.ml;
    const raw = costPerMl * ml * marginForMl(ml);
    return round990Up(raw);
  }
  return null;
}

function extractCreatePerfumeId(
  data: Prisma.PerfumeVariantCreateInput | Prisma.PerfumeVariantUncheckedCreateInput
): string | undefined {
  if ("perfume" in data && data.perfume && "connect" in data.perfume) {
    const c = data.perfume.connect;
    return typeof c?.id === "string" ? c.id : undefined;
  }
  if ("perfumeId" in data) return (data as Prisma.PerfumeVariantUncheckedCreateInput).perfumeId;
  return undefined;
}

function extractUpdatedMl(
  incoming: Prisma.PerfumeVariantUpdateInput["ml"],
  current: number
): number {
  if (typeof incoming === "number") return incoming;
  if (incoming && typeof incoming === "object" && "set" in incoming) {
    const v = (incoming as Prisma.IntFieldUpdateOperationsInput).set;
    return typeof v === "number" ? v : current;
  }
  return current;
}

// Cliente extendido: autoprecio en create/update de PerfumeVariant
export const prisma = base.$extends({
  query: {
    perfumeVariant: {
      async create(ctx: {
        args: Prisma.PerfumeVariantCreateArgs;
        query: (args: Prisma.PerfumeVariantCreateArgs) => Prisma.PrismaPromise<unknown>;
      }) {
        const { args, query } = ctx;

        // union “checked/unchecked”
        type CreateUnion = Prisma.PerfumeVariantCreateInput | Prisma.PerfumeVariantUncheckedCreateInput;
        const data = args.data as CreateUnion;

        const ml = "ml" in data ? Number(data.ml) : NaN;
        const perfumeId = extractCreatePerfumeId(data);
        if (!ml || !perfumeId) return query(args);

        const perfume = await base.perfume.findUnique({ where: { id: perfumeId } });
        if (!perfume) return query(args);

        const price = priceForVariant(perfume as Perfume & Partial<PerfumeUSDProps>, ml);
        if (price == null) return query(args);

        if ("perfume" in data && data.perfume) {
          const out: Prisma.PerfumeVariantCreateArgs = {
            data: {
              ml,
              price,
              perfume: data.perfume,
              // copia opcional conocida sin “any”
              sku: "sku" in data ? (data as Prisma.PerfumeVariantCreateInput).sku : undefined,
              stock: "stock" in data ? (data as Prisma.PerfumeVariantCreateInput).stock : undefined,
              active: "active" in data ? (data as Prisma.PerfumeVariantCreateInput).active : undefined,
              createdAt: "createdAt" in data ? (data as Prisma.PerfumeVariantCreateInput).createdAt : undefined,
              updatedAt: "updatedAt" in data ? (data as Prisma.PerfumeVariantCreateInput).updatedAt : undefined,
              id: "id" in data ? (data as Prisma.PerfumeVariantCreateInput).id : undefined,
            },
          };
          return query(out);
        }

        const u = data as Prisma.PerfumeVariantUncheckedCreateInput;
        const out: Prisma.PerfumeVariantCreateArgs = {
          data: {
            ml,
            price,
            perfumeId: u.perfumeId,
            sku: u.sku,
            stock: u.stock,
            active: u.active,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
            id: u.id,
          },
        };
        return query(out);
      },

      async update(ctx: {
        args: Prisma.PerfumeVariantUpdateArgs;
        query: (args: Prisma.PerfumeVariantUpdateArgs) => Prisma.PrismaPromise<unknown>;
      }) {
        const { args, query } = ctx;
        const where = args.where as Prisma.PerfumeVariantWhereUniqueInput;
        const incoming = args.data as Prisma.PerfumeVariantUpdateInput;

        const current = await base.perfumeVariant.findUnique({
          where,
          include: { perfume: true },
        });
        if (!current) return query(args);

        const ml = extractUpdatedMl(incoming.ml, current.ml);
        const perfume = current.perfume;
        if (!ml || !perfume) return query(args);

        const price = priceForVariant(perfume as Perfume & Partial<PerfumeUSDProps>, ml);
        if (price == null) return query(args);

        const nextArgs: Prisma.PerfumeVariantUpdateArgs = {
          ...args,
          data: { ...incoming, price },
        };
        return query(nextArgs);
      },
    },
  },
});
