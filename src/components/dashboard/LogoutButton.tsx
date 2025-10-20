"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);
      await signOut();
      router.push("/");
    } catch (e) {
      // Fallback duro si algo falla
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      disabled={loading}
    >
      {loading ? "Cerrando..." : "Cerrar sesión"}
    </Button>
  );
}