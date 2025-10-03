"use client";
import { useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";

const fmt = (n:number)=>n.toLocaleString("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0});

export default function VariantSelector({
  perfumeId, perfumeName, brand, image,
  variants,
}: {
  perfumeId: string;
  perfumeName: string;
  brand: string;
  image: string;
  variants: { id:string; ml:number; price:number; stock:number }[];
}) {
  const [sel, setSel] = useState(variants[0]);

  return (
    <>
      <div className="mt-3 text-3xl font-bold text-emerald-300">{fmt(sel.price)}</div>

      <div className="mt-3 flex gap-2">
        {variants.map(v=>(
          <button key={v.id}
            onClick={()=>setSel(v)}
            disabled={v.stock<=0}
            className={`px-3 py-2 rounded border ${
              v.id===sel.id ? "border-white bg-white/10" : "border-white/40 hover:border-white"
            } ${v.stock<=0?"opacity-50 cursor-not-allowed":""}`}>
            {v.ml} ml {v.stock<=0?"· sin stock":""}
          </button>
        ))}
      </div>

      <div className="mt-5">
       <AddToCartButton
  productId={perfumeId}
  variantId={sel.id}
  name={perfumeName}
  brand={brand}
  ml={sel.ml}
  price={sel.price}     // <-- clave
  stock={sel.stock}
  image={image}
/>
      </div>

      <div className="mt-2 text-sm text-white/80">Stock seleccionado: {sel.stock}</div>
    </>
  );
}
