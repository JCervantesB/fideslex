"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type Item = {
  id: number;
  startAt: string; // ISO string
  endAt: string;   // ISO string
  status: string;
  services?: string[];           // nombres de servicios asociados
  providerName?: string | null;  // sólo en vista admin
  clientName?: string | null;    // útil para identificar al cliente
  clientEmail?: string | null;   // útil para identificar al cliente
};

type Props = {
  title: string;
  items: Item[];
  showProvider?: boolean; // mostrar columna de profesional (vista admin)
  canEdit?: boolean;      // permitir edición de estado
};

export default function AppointmentsTable({ title, items, showProvider = false, canEdit = true }: Props) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const [rows, setRows] = useState<Item[]>(items);
  useEffect(() => {
    setRows(items);
  }, [items]);

  // Filtro por estado
  const [filter, setFilter] = useState<"all" | "pendiente" | "finalizado" | "cancelado">("all");
  const visibleRows = useMemo(() => {
    const base = filter === "all" ? rows : rows.filter((r) => r.status === filter);
    return [...base].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [rows, filter]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [nextStatus, setNextStatus] = useState<string>("pendiente");
  const [message, setMessage] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  async function updateStatus(id: number, status: string) {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/citas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "No se pudo actualizar el estado");
      }
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      setEditingId(null);
    } catch (e: any) {
      setMessage(e.message || "Error al actualizar el estado");
    } finally {
      setSaving(false);
    }
  }

  if (!isClient) return null;

  return (
    <div className="rounded-md border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-2">
          <Button variant={filter === "all" ? "secondary" : "outline"} size="sm" onClick={() => setFilter("all")}>Todas</Button>
          <Button variant={filter === "pendiente" ? "secondary" : "outline"} size="sm" onClick={() => setFilter("pendiente")}>Pendientes</Button>
          <Button variant={filter === "finalizado" ? "secondary" : "outline"} size="sm" onClick={() => setFilter("finalizado")}>Finalizadas</Button>
          <Button variant={filter === "cancelado" ? "secondary" : "outline"} size="sm" onClick={() => setFilter("cancelado")}>Canceladas</Button>
        </div>
      </div>

      {visibleRows.length === 0 ? (
        <div className="text-sm text-muted-foreground">No hay citas para mostrar.</div>
      ) : (
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <table className="min-w-full border rounded-md">
            <thead>
              <tr className="border-b bg-muted">
                <th className="text-left p-3">Fecha</th>
                <th className="text-left p-3">Hora</th>
                <th className="text-left p-3">Cliente</th>
                {showProvider && <th className="text-left p-3">Profesional</th>}
                <th className="text-left p-3">Servicio</th>
                <th className="text-left p-3">Estado</th>
                {canEdit && <th className="text-left p-3">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((it) => {
                const start = new Date(it.startAt);
                const dateLabel = `${start.toLocaleDateString()}`;
                const timeLabel = `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
                const clientLabel = it.clientName || it.clientEmail || "—";
                const providerLabel = it.providerName || "—";
                const servicesLabel = (it.services && it.services.length > 0) ? it.services.join(", ") : "—";
                const isEditing = editingId === it.id;
                const cancelDisabled = saving || it.status === "finalizado" || it.status === "cancelado";
                const finalizeDisabled = saving || it.status === "finalizado" || it.status === "cancelado";
                return (
                  <tr key={it.id} className="border-b">
                    <td className="p-3">{dateLabel}</td>
                    <td className="p-3">{timeLabel}</td>
                    <td className="p-3">{clientLabel}</td>
                    {showProvider && <td className="p-3">{providerLabel}</td>}
                    <td className="p-3">{servicesLabel}</td>
                    <td className="p-3">
                      {isEditing ? (
                        <select
                          className="border rounded px-2 py-1 text-sm"
                          value={nextStatus}
                          onChange={(e) => setNextStatus(e.target.value)}
                        >
                          <option value="pendiente">pendiente</option>
                          <option value="finalizado">finalizado</option>
                          <option value="cancelado">cancelado</option>
                        </select>
                      ) : (
                        it.status
                      )}
                    </td>
                    {canEdit && (
                      <td className="p-3">
                        {!isEditing ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => setEditingId(it.id)}
                              disabled={saving}
                            >
                              Modificar
                            </Button>
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white"
                              onClick={async () => {
                                const start = new Date(it.startAt);
                                const dateLabel = `${start.toLocaleDateString()}`;
                                const timeLabel = `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
                                const clientLabel = it.clientName || it.clientEmail || "—";
                                const servicesLabel = (it.services && it.services.length > 0) ? it.services.join(", ") : "—";
                                const ok = window.confirm(
                                  `¿Cancelar esta cita?\n\nCliente: ${clientLabel}\nFecha: ${dateLabel}\nHora: ${timeLabel}\nServicio: ${servicesLabel}`
                                );
                                if (!ok) return;
                                await updateStatus(it.id, "cancelado");
                              }}
                              disabled={cancelDisabled}
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => updateStatus(it.id, "finalizado")}
                              disabled={finalizeDisabled}
                            >
                              Finalizar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => updateStatus(it.id, nextStatus)}
                              disabled={saving}
                            >
                              Guardar
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setEditingId(null)} disabled={saving}>Cancelar</Button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {message && <p className="text-destructive text-sm">{message}</p>}
    </div>
  );
}