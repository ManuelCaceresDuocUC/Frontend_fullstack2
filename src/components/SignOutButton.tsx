"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="px-4 py-2 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 transition"
    >
      Cerrar sesión
    </button>
  );
}
