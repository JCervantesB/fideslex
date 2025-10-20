"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  caseId: number | null;
  createdAt: string;
};

export default function NotificationsBell({ role }: { role: string | null }) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notificaciones", { cache: "no-store" });
      const data = await res.json();
      if (data?.ok && Array.isArray(data.items)) {
        setItems(data.items as NotificationItem[]);
      }
    } catch (e) {
      // Silenciar errores para no afectar UX
      console.warn("Fallo cargando notificaciones", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Solo mostrar a usuarios y admins
    if (role !== "usuario" && role !== "administrador") return;

    let active = true;
    (async () => {
      if (!active) return;
      await fetchItems();
    })();

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchItems, 15000);

    return () => {
      active = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [role]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-notify-root]")) setOpen(false);
    };
    if (open) document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);

  if (role !== "usuario" && role !== "administrador") return null;

  const unreadCount = items.length;

  const handleItemClick = async (it: NotificationItem) => {
    try {
      await fetch(`/api/notificaciones/${it.id}`, { method: "PATCH" });
    } catch {}
    if (it.linkUrl) router.push(it.linkUrl);
    setOpen(false);
    // Refrescar lista tras marcar como leída
    setItems((prev) => prev.filter((x) => x.id !== it.id));
  };

  const goToHistory = () => {
    router.push("/dashboard/notificaciones");
    setOpen(false);
  };

  return (
    <div className="relative" data-notify-root>
      <button
        className="group relative p-2 rounded-lg bg-background hover:bg-secondary hover:text-secondary-foreground transition-colors border border-input"
        aria-label="Notificaciones"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="w-6 h-6 text-foreground group-hover:text-secondary-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-semibold px-1.5 py-0.5 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border bg-popover text-popover-foreground shadow-md z-50">
          <div className="p-2 border-b flex items-center justify-between">
            <span className="text-sm font-semibold">Notificaciones</span>
            {loading && <span className="text-xs text-muted-foreground">cargando…</span>}
          </div>

          {items.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">No hay notificaciones nuevas.</div>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.map((it) => (
                <li key={it.id}>
                  <button
                    className="w-full text-left p-3 hover:bg-muted/40 transition-colors"
                    onClick={() => handleItemClick(it)}
                  >
                    <div className="text-sm font-medium">{it.title}</div>
                    {it.body && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{it.body}</div>
                    )}
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {new Date(it.createdAt).toLocaleString()}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t p-2">
            <button className="text-xs text-muted-foreground hover:text-foreground" onClick={goToHistory}>
              Ver historial
            </button>
          </div>
        </div>
      )}
    </div>
  );
}