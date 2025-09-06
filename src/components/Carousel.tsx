"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Img = { src: string; alt?: string };

export default function Carousel({ images }: { images: Img[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

  const scrollTo = (i: number) => {
    const el = viewportRef.current;
    if (!el) return;
    const w = el.clientWidth;
    el.scrollTo({ left: i * w, behavior: "smooth" });
    setIdx(i);
  };

  // sync index on manual scroll / resize
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onScroll = () => setIdx(Math.round(el.scrollLeft / el.clientWidth));
    const onResize = () => onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="relative">
      {/* viewport */}
      <div
        ref={viewportRef}
        className="overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
      >
        <div className="flex">
          {images.map((img, i) => (
            <div key={i} className="min-w-full snap-center">
              {/* usa <img> simple para compat universal */}
              <img
                src={img.src}
                alt={img.alt ?? `img-${i + 1}`}
                className="w-full h-[60vh] md:h-[70vh] object-cover"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* arrows */}
      <button
        aria-label="prev"
        onClick={() => scrollTo(Math.max(0, idx - 1))}
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/70 p-2 shadow hover:bg-white"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        aria-label="next"
        onClick={() => scrollTo(Math.min(images.length - 1, idx + 1))}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/70 p-2 shadow hover:bg-white"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className={`h-2.5 w-2.5 rounded-full transition ${
              i === idx ? "bg-white" : "bg-white/40"
            }`}
            aria-label={`ir a ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
