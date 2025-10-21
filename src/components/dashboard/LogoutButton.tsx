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
      
      // Llamar a nuestra API de logout personalizada
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      
      // También llamar al signOut de better-auth como respaldo
      try {
        await signOut();
      } catch (e) {
        console.warn("Error en signOut de better-auth:", e);
      }
      
      // Limpiar cualquier cookie de sesión manualmente
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        if (name) {
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
        }
      });
      
      // Limpiar localStorage y sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirección forzada con recarga completa
      window.location.href = "/";
    } catch (e) {
      console.error("Error durante logout:", e);
      // Fallback duro: limpiar todo y redirigir
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        if (name) {
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
        }
      });
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm md:text-base px-2 sm:px-3 md:px-4"
      onClick={handleLogout}
      disabled={loading}
    >
      {loading ? "Cerrando..." : "Cerrar sesión"}
    </Button>
  );
}