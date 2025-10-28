"use client";

import Link from "next/link";
// import { useRouter } from "next/navigation";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { useEffect, useState } from "react";
import NotificationsBell from "@/components/dashboard/NotificationsBell";

export default function DesktopDashboardNavbar() {
  // const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

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
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="font-bold text-xl text-secondary-foreground hover:text-muted-foreground transition-colors">Fides Lex</Link>
          <Link href="/dashboard" className="text-sm text-secondary-foreground hover:text-muted-foreground transition-colors">Dashboard</Link>
          {role === "administrador" && (
            <>
              {/* <Link href="/dashboard/cliente" className="text-sm text-primary-foreground hover:text-secondary">Vista cliente</Link> */}
              <Link href="/dashboard/usuario/solicitudes-citas" className="text-sm text-secondary-foreground hover:text-muted-foreground transition-colors">Solicitudes</Link>
              <Link href="/dashboard/usuario/casos" className="text-sm text-secondary-foreground hover:text-muted-foreground transition-colors">Casos</Link>
              <Link href="/dashboard/usuario/calendario" className="text-sm text-secondary-foreground hover:text-muted-foreground transition-colors">Calendario</Link>
              <Link href="/dashboard/admin/servicios" className="text-sm text-secondary-foreground hover:text-muted-foreground transition-colors">Servicios</Link>
              <Link href="/dashboard/admin/usuarios" className="text-sm text-secondary-foreground hover:text-muted-foreground transition-colors">Usuarios</Link>
              <Link href="/dashboard/cliente/direcciones" className="text-sm text-secondary-foreground hover:text-muted-foreground transition-colors">Direcciones</Link>
            </>
          )}
          {role === "usuario" && (
            <>
              <Link href="/dashboard/usuario/servicios" className="text-sm text-secondary-foreground hover:text-muted-foreground transition-colors">Servicios</Link>
              <Link href="/dashboard/usuario/solicitudes-citas" className="text-sm text-secondary-foreground hover:text-muted-foreground transition-colors">Solicitudes</Link>
              <Link href="/dashboard/usuario/casos" className="text-sm text-secondary-foreground hover:text-muted-foreground transition-colors">Casos</Link>
              <Link href="/dashboard/usuario/calendario" className="text-sm text-secondary-foreground hover:text-muted-foreground transition-colors">Calendario</Link>
              <Link href="/dashboard/cliente/direcciones" className="text-sm text-secondary-foreground hover:text-muted-foreground transition-colors">Direcciones</Link>
            </>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <NotificationsBell role={role} />
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}