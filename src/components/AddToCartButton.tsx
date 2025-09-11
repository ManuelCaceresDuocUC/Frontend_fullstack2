// src/components/AddToCartButton.tsx
'use client';
import { useCart } from '@/store/useCart';

type Props = {
  id: string; name: string; brand: string; price: number; ml: number; image?: string; disabled?: boolean;
};

export default function AddToCartButton({ id, name, brand, price, ml, image, disabled=false }: Props) {
  const add  = useCart(s => s.add);
  const open = useCart(s => s.open);

  const onClick = () => {
    if (disabled) return;
    add({ id, name, brand, ml, price, image, qty: 1 });
    open();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={`rounded-xl px-3 py-2 text-white ${disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
    >
      Agregar
    </button>
  );
}
