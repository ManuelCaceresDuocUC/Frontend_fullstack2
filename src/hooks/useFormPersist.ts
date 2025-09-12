// src/hooks/useFormPersist.ts
"use client";
import { useEffect, useRef } from "react";

export function useFormPersist<T>(
  key: string,
  data: T,
  setData: (v: T) => void,
  delay = 400
) {
  const ready = useRef(false);

  // Cargar guardado
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setData(JSON.parse(raw) as T);
    } catch {}
    ready.current = true;
  }, [key, setData]);

  // Guardar con debounce
  useEffect(() => {
    if (!ready.current) return;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch {}
    }, delay);
    return () => clearTimeout(id);
  }, [key, data, delay]);

  const clear = () => {
    try {
      localStorage.removeItem(key);
    } catch {}
  };

  return { clear };
}
