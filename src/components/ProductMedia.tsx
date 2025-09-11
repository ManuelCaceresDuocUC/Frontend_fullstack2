"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type Props = { images: string[]; title: string };

export default function ProductMedia({ images, title }: Props) {
  const [idx, setIdx] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [origin, setOrigin] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const stripRef = useRef<HTMLDivElement>(null);

  const go = (dir: number) => setIdx((i) => (i + dir + images.length) % images.length);
  const openZoom = () => {
    setZoom(1);
    setZoomOpen(true);
  };
  const toggleZoom = () => setZoom((z) => (z === 1 ? 2.5 : 1));
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoom === 1) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setOrigin({ x, y });
  };
  const onThumbClick = (i: number) => {
    setIdx(i);
    const el = stripRef.current?.children[i] as HTMLElement | undefined;
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  };
  const scrollThumbs = (dir: number) => {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const current = images[idx] ?? images[0];

  return (
    <section className="space-y-4">
      {/* Visor principal */}
      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl border bg-white">
        <Image
          src={current}
          alt={title}
          fill
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover"
          priority
          onClick={openZoom}
        />
        {/* Flechas */}
        {images.length > 1 && (
          <>
            <button
              aria-label="Anterior"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 hover:bg-white px-3 py-2 shadow backdrop-blur"
            >
              ‹
            </button>
            <button
              aria-label="Siguiente"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 hover:bg-white px-3 py-2 shadow backdrop-blur"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Carrusel de miniaturas */}
      {images.length > 1 && (
        <div className="relative">
          <div className="absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-white to-transparent pointer-events-none rounded-l-2xl" />
          <div className="absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white to-transparent pointer-events-none rounded-r-2xl" />

          <div className="flex items-center gap-2">
            <button
              aria-label="Desplazar a la izquierda"
              onClick={() => scrollThumbs(-1)}
              className="hidden sm:inline rounded-full border bg-white px-2 py-2 shadow hover:bg-neutral-50"
            >
              ‹
            </button>

            <div
              ref={stripRef}
              className="flex gap-3 overflow-x-auto scroll-smooth rounded-2xl border bg-white p-2"
            >
              {images.map((src, i) => (
                <button
                  key={src + i}
                  onClick={() => onThumbClick(i)}
                  className={`relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border ${i === idx ? "ring-2 ring-emerald-600" : ""}`}
                  aria-label={`Vista ${i + 1}`}
                >
                  <Image src={src} alt={`Vista ${i + 1}`} fill sizes="160px" className="object-cover" />
                </button>
              ))}
            </div>

            <button
              aria-label="Desplazar a la derecha"
              onClick={() => scrollThumbs(1)}
              className="hidden sm:inline rounded-full border bg-white px-2 py-2 shadow hover:bg-neutral-50"
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* Modal de zoom */}
      {zoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          onClick={() => setZoomOpen(false)}
        >
          <div className="absolute inset-0 m-auto max-w-6xl w-[92vw] p-4" onClick={(e) => e.stopPropagation()}>
            <div
              className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl bg-black"
              onMouseMove={onMove}
              onClick={toggleZoom}
              title="Click para zoom"
            >
              <Image
                src={current}
                alt={title}
                fill
                sizes="90vw"
                className="object-contain"
                style={{ transform: `scale(${zoom})`, transformOrigin: `${origin.x}% ${origin.y}%` }}
              />
              {/* Flechas modal */}
              {images.length > 1 && (
                <>
                  <button
                    aria-label="Anterior"
                    onClick={() => go(-1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 hover:bg-white px-3 py-2 shadow"
                  >
                    ‹
                  </button>
                  <button
                    aria-label="Siguiente"
                    onClick={() => go(1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 hover:bg-white px-3 py-2 shadow"
                  >
                    ›
                  </button>
                </>
              )}
              <button
                aria-label="Cerrar"
                onClick={() => setZoomOpen(false)}
                className="absolute right-3 top-3 rounded-full bg-white/90 hover:bg-white px-3 py-1 shadow"
              >
                ✕
              </button>
            </div>
            <p className="mt-3 text-center text-white/80 text-sm">Click para alternar zoom. Arrastra el cursor para mover el punto de enfoque.</p>
          </div>
        </div>
      )}
    </section>
  );
}
