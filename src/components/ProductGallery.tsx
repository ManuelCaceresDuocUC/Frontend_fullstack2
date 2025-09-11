"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Props = {
  images: string[];
  alt: string;
  fallback?: string;
};

export default function ProductGallery({ images, alt, fallback }: Props) {
  const list = images.length ? images : [fallback ?? "https://via.placeholder.com/1200x1500?text=Imagen"];
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  // ----- Main image (4:5), sin recorte del producto -----
  return (
    <div>
      <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden border border-white/20 bg-white">
        <Image
          src={list[idx]}
          alt={alt}
          fill
          sizes="(max-width:768px) 100vw, 50vw"
          className="object-contain p-4"
          priority
        />
        <div className="absolute bottom-2 right-2 flex gap-2">
          <button
            type="button"
            onClick={() => { setOpen(true); setZoom(1.5); }}
            className="px-3 py-1.5 rounded-xl text-sm bg-black/60 text-white hover:bg-black/70"
          >
            Ampliar
          </button>
        </div>
      </div>

      {list.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {list.map((u, i) => (
            <button
              key={u + i}
              type="button"
              onClick={() => setIdx(i)}
              className={`relative aspect-square rounded-lg overflow-hidden border ${i === idx ? "border-amber-300" : "border-white/20"} bg-white`}
              aria-label={`miniatura ${i + 1}`}
            >
              <Image src={u} alt="miniatura" fill sizes="25vw" className="object-contain p-1.5" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox con zoom y paneo */}
      {open && (
        <Lightbox src={list[idx]} alt={alt} onClose={() => setOpen(false)} zoom={zoom} setZoom={setZoom} />
      )}
    </div>
  );
}

function Lightbox({
  src, alt, onClose, zoom, setZoom,
}: { src: string; alt: string; onClose: () => void; zoom: number; setZoom: (z: number) => void }) {
  const clamp = (z: number) => Math.max(1, Math.min(4, z));

  // Esc para cerrar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    // Backdrop: clic afuera => cierra
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Contenedor del contenido: detiene el clic para no cerrar */}
      <div
        className="max-h-[90vh] max-w-[90vw] overflow-auto cursor-grab active:cursor-grabbing p-4"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => {
          e.preventDefault();
          setZoom(clamp(zoom + (e.deltaY < 0 ? 0.2 : -0.2)));
        }}
      >
        <img
          src={src}
          alt={alt}
          style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
          className="max-h-[80vh] max-w-[80vw] object-contain select-none"
          draggable={false}
          onDoubleClick={() => setZoom(zoom === 1 ? 2 : 1)}
        />
      </div>

      {/* Controles: también detienen el clic */}
      <div
        className="absolute bottom-4 inset-x-0 flex justify-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={() => setZoom(clamp(zoom - 0.25))} className="px-3 py-1.5 rounded bg-white/90">−</button>
        <span className="px-3 py-1.5 rounded bg-white/70 text-sm">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(clamp(zoom + 0.25))} className="px-3 py-1.5 rounded bg-white/90">+</button>
        <button onClick={() => setZoom(1)} className="px-3 py-1.5 rounded bg-white/90">Reset</button>
      </div>
    </div>
  );
}
