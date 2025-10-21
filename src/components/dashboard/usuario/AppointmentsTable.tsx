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
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al actualizar el estado";
      setMessage(msg);
    } finally {
      setSaving(false);
    }
  }

  if (!isClient) return null;

  return (
    <div className="rounded-md border p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant={filter === "all" ? "secondary" : "outline"} size="sm" className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm md:text-base px-2 sm:px-3 md:px-4" onClick={() => setFilter("all")}>Todas</Button>
          <Button variant={filter === "pendiente" ? "secondary" : "outline"} size="sm" className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm md:text-base px-2 sm:px-3 md:px-4" onClick={() => setFilter("pendiente")}>Pendientes</Button>
          <Button variant={filter === "finalizado" ? "secondary" : "outline"} size="sm" className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm md:text-base px-2 sm:px-3 md:px-4" onClick={() => setFilter("finalizado")}>Finalizadas</Button>
          <Button variant={filter === "cancelado" ? "secondary" : "outline"} size="sm" className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm md:text-base px-2 sm:px-3 md:px-4" onClick={() => setFilter("cancelado")}>Canceladas</Button>
        </div>
      </div>

      {visibleRows.length === 0 ? (
        <div className="text-sm text-muted-foreground">No hay citas para mostrar.</div>
      ) : (
        <>
          {/* Vista móvil: cards */}
          <div className="md:hidden space-y-3">
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
                <div key={it.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-muted-foreground">{dateLabel}</div>
                      <div className="font-medium">{timeLabel}</div>
                    </div>
                    <div className="shrink-0">
                      {isEditing ? (
                        <select
                          className="border rounded px-2 py-1 text-xs"
                          value={nextStatus}
                          onChange={(e) => setNextStatus(e.target.value)}
                        >
                          <option value="pendiente">pendiente</option>
                          <option value="finalizado">finalizado</option>
                          <option value="cancelado">cancelado</option>
                        </select>
                      ) : (
                        <span className="inline-block bg-muted px-2 py-1 text-xs rounded">{it.status}</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="text-sm"><span className="text-muted-foreground">Cliente:</span> {clientLabel}</div>
                    {showProvider && <div className="text-sm"><span className="text-muted-foreground">Profesional:</span> {providerLabel}</div>}
                    <div className="text-sm"><span className="text-muted-foreground">Servicio:</span> {servicesLabel}</div>
                  </div>

                  {canEdit && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {!isEditing ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs px-2"
                            onClick={() => setEditingId(it.id)}
                            disabled={saving}
                          >
                            Modificar
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white h-8 text-xs px-2"
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
                            className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs px-2"
                            onClick={() => updateStatus(it.id, "finalizado")}
                            disabled={finalizeDisabled}
                          >
                            Finalizar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 text-xs px-2"
                            onClick={() => updateStatus(it.id, nextStatus)}
                            disabled={saving}
                          >
                            Guardar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs px-2"
                            onClick={() => setEditingId(null)}
                            disabled={saving}
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Vista escritorio: tabla original */}
          <div className="md:!hidden space-y-3">
            {visibleRows.map((it) => {
              const start = new Date(it.startAt);
              const dateLabel = `${start.toLocaleDateString()}`;
              const timeLabel = `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
              const clientLabel = it.clientName || it.clientEmail || "—";
              const providerLabel = it.providerName || "—";
              const servicesLabel = it.services && it.services.length > 0 ? it.services.join(", ") : "—";
              const isEditing = editingId === it.id;
              const cancelDisabled = saving || it.status === "finalizado" || it.status === "cancelado";
              const finalizeDisabled = saving || it.status === "finalizado" || it.status === "cancelado";
              return (
                <div key={it.id} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{dateLabel} · {timeLabel}</div>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100">{it.status}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Cliente:</span> {clientLabel}
                  </div>
                  {showProvider && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Profesional:</span> {providerLabel}
                    </div>
                  )}
                  <div className="text-sm">
                    <span className="text-muted-foreground">Servicios:</span> {servicesLabel}
                  </div>
                  {canEdit && (
                    <div className="pt-2">
                      {!isEditing ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs px-2"
                            onClick={() => setEditingId(it.id)}
                            disabled={saving}
                          >
                            Modificar
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white h-8 text-xs px-2"
                            onClick={async () => {
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
                            className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs px-2"
                            onClick={() => updateStatus(it.id, "finalizado")}
                            disabled={finalizeDisabled}
                          >
                            Finalizar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <select
                            className="border rounded px-2 py-1 text-sm"
                            value={nextStatus}
                            onChange={(e) => setNextStatus(e.target.value)}
                          >
                            <option value="pendiente">pendiente</option>
                            <option value="finalizado">finalizado</option>
                            <option value="cancelado">cancelado</option>
                          </select>
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 text-xs px-2"
                            onClick={() => updateStatus(it.id, nextStatus)}
                            disabled={saving}
                          >
                            Guardar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs px-2"
                            onClick={() => setEditingId(null)}
                            disabled={saving}
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="hidden md:!block overflow-x-auto">
            <table className="min-w-[800px] w-full border">
              <thead>
                <tr className="bg-muted">
                  <th className="p-3 text-left">Fecha</th>
                  <th className="p-3 text-left">Hora</th>
                  <th className="p-3 text-left">Cliente</th>
                  {showProvider && <th className="p-3 text-left">Profesional</th>}
                  <th className="p-3 text-left">Servicio(s)</th>
                  <th className="p-3 text-left">Estado</th>
                  {canEdit && <th className="p-3 text-left">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((it) => {
                  const start = new Date(it.startAt);
                  const dateLabel = `${start.toLocaleDateString()}`;
                  const timeLabel = `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
                  const clientLabel = it.clientName || it.clientEmail || "—";
                  const providerLabel = it.providerName || "—";
                  const servicesLabel = it.services && it.services.length > 0 ? it.services.join(", ") : "—";
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
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                                onClick={() => setEditingId(it.id)}
                                disabled={saving}
                              >
                                Modificar
                              </Button>
                              <Button
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                                onClick={async () => {
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
                                className="bg-green-600 hover:bg-green-700 text-white h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
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
                                className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                                onClick={() => updateStatus(it.id, nextStatus)}
                                disabled={saving}
                              >
                                Guardar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                                onClick={() => setEditingId(null)}
                                disabled={saving}
                              >
                                Cancelar
                              </Button>
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
        </>
      )}

      {message && <p className="text-destructive text-sm">{message}</p>}
    </div>
  );
}