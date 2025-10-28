"use client";

import Link from "next/link";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { useEffect, useState } from "react";
import NotificationsBell from "@/components/dashboard/NotificationsBell";
import { Menu, X } from "lucide-react";

export default function MobileDashboardNavbar() {
  const [role, setRole] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (active && data?.ok && data.item) {
          setRole(data.item.role as string);
        }
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <nav className="w-full border-b bg-primary">
      <div className="mx-auto max-w-7xl px-3 py-2 flex items-center justify-between">
        {/* Brand + toggle */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="font-bold text-lg !text-secondary-foreground hover:!text-muted-foreground transition-colors">Fides Lex</Link>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 border border-input bg-background/70 hover:bg-muted !text-secondary-foreground transition-colors"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-2">
          <NotificationsBell role={role} />
          <LogoutButton />
        </div>
      </div>

      {/* Dropdown panel */}
      {menuOpen && (
        <div className="border-t border-border bg-primary/95 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-3 py-2 flex flex-col gap-1">
            <Link href="/dashboard" className="px-2 py-2 rounded hover:bg-primary-light !text-secondary-foreground transition-colors" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            {role === "administrador" && (
              <>
                <Link href="/dashboard/usuario/solicitudes-citas" className="px-2 py-2 rounded hover:bg-primary-light !text-secondary-foreground transition-colors" onClick={() => setMenuOpen(false)}>Solicitudes</Link>
                <Link href="/dashboard/usuario/casos" className="px-2 py-2 rounded hover:bg-primary-light !text-secondary-foreground transition-colors" onClick={() => setMenuOpen(false)}>Casos</Link>
                <Link href="/dashboard/usuario/calendario" className="px-2 py-2 rounded hover:bg-primary-light !text-secondary-foreground transition-colors" onClick={() => setMenuOpen(false)}>Calendario</Link>
                <Link href="/dashboard/admin/servicios" className="px-2 py-2 rounded hover:bg-primary-light !text-secondary-foreground transition-colors" onClick={() => setMenuOpen(false)}>Servicios</Link>
                <Link href="/dashboard/admin/usuarios" className="px-2 py-2 rounded hover:bg-primary-light !text-secondary-foreground transition-colors" onClick={() => setMenuOpen(false)}>Usuarios</Link>
                <Link href="/dashboard/cliente/direcciones" className="px-2 py-2 rounded hover:bg-primary-light !text-secondary-foreground transition-colors" onClick={() => setMenuOpen(false)}>Direcciones</Link>
              </>
            )}
            {role === "usuario" && (
              <>
                <Link href="/dashboard/usuario/servicios" className="px-2 py-2 rounded hover:bg-primary-light !text-secondary-foreground transition-colors" onClick={() => setMenuOpen(false)}>Servicios</Link>
                <Link href="/dashboard/usuario/solicitudes-citas" className="px-2 py-2 rounded hover:bg-primary-light !text-secondary-foreground transition-colors" onClick={() => setMenuOpen(false)}>Solicitudes</Link>
                <Link href="/dashboard/usuario/casos" className="px-2 py-2 rounded hover:bg-primary-light !text-secondary-foreground transition-colors" onClick={() => setMenuOpen(false)}>Casos</Link>
                <Link href="/dashboard/usuario/calendario" className="px-2 py-2 rounded hover:bg-primary-light !text-secondary-foreground transition-colors" onClick={() => setMenuOpen(false)}>Calendario</Link>
                <Link href="/dashboard/cliente/direcciones" className="px-2 py-2 rounded hover:bg-primary-light !text-secondary-foreground transition-colors" onClick={() => setMenuOpen(false)}>Direcciones</Link>
              </>
            )}
            {role === "cliente" && (
              <>
                <Link href="/dashboard/cliente/direcciones" className="px-2 py-2 rounded hover:bg-primary-light !text-secondary-foreground transition-colors" onClick={() => setMenuOpen(false)}>Direcciones</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}