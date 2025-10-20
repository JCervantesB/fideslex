'use client'

import React from "react";

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function startMinToHHMM(m: number) {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function HHMMtoStartMin(s: string) {
  const [h, m] = s.split(":").map((x) => Number(x));
  return h * 60 + m;
}

// Tipos para solicitudes y estado de conversión
type Request = {
  id: number;
  clientId: string | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  desiredDate: string | Date | number;
  desiredStartMin: number;
  serviceName: string;
  status: string;
};

type Row = {
  id: number;
  clientId: string | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  desiredDate: string;
  desiredStartMin: number;
  serviceName: string;
  status: string;
  serviceId: number | null;
  userId: string | null;
  date: string;
  time: string;
  converting: boolean;
  done: boolean;
  error: string | null;
};

function dateToYYYYMMDD(d: string | Date | number): string {
  try {
    const dt = new Date(d);
    const y = dt.getFullYear();
    const mo = String(dt.getMonth() + 1).padStart(2, "0");
    const da = String(dt.getDate()).padStart(2, "0");
    return `${y}-${mo}-${da}`;
  } catch {
    return String(d);
  }
}

function useFetchAssignees(serviceId: number | null) {
  const [items, setItems] = React.useState<Array<{ userId: string; firstName: string | null; lastName: string | null }>>([]);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    let cancel = false;
    async function run() {
      if (!serviceId) {
        setItems([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/servicios/${serviceId}/usuarios`, { cache: "no-store" });
        const data = await res.json();
        if (!cancel && data?.ok) {
          setItems(data.items || []);
        }
      } catch {}
      setLoading(false);
    }
    run();
    return () => {
      cancel = true;
    };
  }, [serviceId]);
  return { items, loading };
}

function useAvailability(userId: string | null, date: string | null) {
  const [slots, setSlots] = React.useState<Array<{ start: string; end: string }>>([]);
  const [loading, setLoading] = React.useState(false);
  const fetchSlots = async () => {
    if (!userId || !date) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/disponibilidad?userId=${encodeURIComponent(userId)}&date=${encodeURIComponent(date)}`, { cache: "no-store" });
      const data = await res.json();
      if (data?.ok) {
        setSlots(data.slots || []);
      }
    } catch {}
    setLoading(false);
  };
  return { slots, loading, fetchSlots };
}

export default function RequestsConverter({ requests, services }: { requests: Request[]; services: Array<{ id: number; nombre: string; estado: string }> }) {
  const [state, setState] = React.useState<Row[]>(() => {
    return requests.map((r) => {
      const target = services.find((s) => normalize(s.nombre) === normalize(r.serviceName)) || null;
      return {
        id: r.id as number,
        clientId: r.clientId ?? null,
        clientName: r.clientName as string,
        clientEmail: r.clientEmail as string,
        clientPhone: r.clientPhone as string,
        desiredDate: dateToYYYYMMDD(r.desiredDate),
        desiredStartMin: r.desiredStartMin as number,
        serviceName: r.serviceName as string,
        status: r.status as string,
        serviceId: target?.id ?? null,
        userId: null as string | null,
        date: dateToYYYYMMDD(r.desiredDate),
        time: startMinToHHMM(r.desiredStartMin),
        converting: false,
        done: false,
        error: null as string | null,
      };
    });
  });

  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state;
    return state.filter((r) =>
      (r.clientName && r.clientName.toLowerCase().includes(q)) ||
      (r.clientEmail && r.clientEmail.toLowerCase().includes(q)) ||
      (r.serviceName && r.serviceName.toLowerCase().includes(q))
    );
  }, [state, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = React.useMemo(() => filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize), [filtered, page]);

  React.useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <input
          type="text"
          className="w-full max-w-xs border rounded px-2 py-1 text-sm"
          placeholder="Buscar por cliente, email o servicio"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="text-xs text-muted-foreground">Mostrando {pageRows.length} de {filtered.length}</div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-xs">
              <th className="text-left px-3 py-2">Cliente</th>
              <th className="text-left px-3 py-2">Servicio (texto)</th>
              <th className="text-left px-3 py-2">Fecha deseada</th>
              <th className="text-left px-3 py-2">Hora deseada</th>
              <th className="text-left px-3 py-2">Estado</th>
              <th className="text-right px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, idx) => (
              <RequestRow key={row.id} row={row} setRow={(u) => setState((old) => old.map((o, i) => (i === idx ? { ...o, ...u } : o)))} services={services} />
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No hay solicitudes para mostrar</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          className="px-3 py-1 border rounded text-sm disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Anterior
        </button>
        <span className="text-sm">{page} / {totalPages}</span>
        <button
          type="button"
          className="px-3 py-1 border rounded text-sm disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

function RequestRow({ row, setRow, services }: { row: Row; setRow: (u: Partial<Row>) => void; services: Array<{ id: number; nombre: string; estado: string }> }) {
  const [open, setOpen] = React.useState(false);
  const serviceId = row.serviceId as number | null;
  const { items: assignees, loading: assLoading } = useFetchAssignees(serviceId);
  const { slots, loading: slotsLoading, fetchSlots } = useAvailability(row.userId, row.date);
  const canConvert = row.status === "solicitada" || row.status === "pendiente";

  const onConvert = async () => {
    setRow({ converting: true, error: null });
    try {
      if (!row.serviceId || !row.userId || !row.date || !row.time) {
        setRow({ error: "Completa servicio, empleado, fecha y hora" });
        setRow({ converting: false });
        return;
      }
      const startMin = HHMMtoStartMin(row.time);
      const res = await fetch(`/api/solicitudes-citas/${row.id}/convertir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: row.serviceId, userId: row.userId, date: row.date, startMin }),
      });
      const data = await res.json();
      if (!data?.ok) {
        setRow({ error: data?.error || "Error al convertir" });
      } else {
        setRow({ done: true, status: "programada" });
        setOpen(false);
      }
    } catch (e) {
      setRow({ error: e instanceof Error ? e.message : String(e) });
    }
    setRow({ converting: false });
  };

  return (
    <>
      <tr className="border-b">
        <td className="px-3 py-2 whitespace-nowrap">
          <div className="font-medium">{row.clientName}</div>
          <div className="text-xs text-muted-foreground">{row.clientEmail}</div>
        </td>
        <td className="px-3 py-2 whitespace-nowrap">{row.serviceName}</td>
        <td className="px-3 py-2 whitespace-nowrap">{row.desiredDate}</td>
        <td className="px-3 py-2 whitespace-nowrap">{startMinToHHMM(row.desiredStartMin)}</td>
        <td className="px-3 py-2 whitespace-nowrap">{row.status}</td>
        <td className="px-3 py-2 text-right">
          {canConvert ? (
            <button
              type="button"
              className="px-3 py-1 border rounded text-sm"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "Cerrar" : "Convertir"}
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">Procesada</span>
          )}
        </td>
      </tr>

      {open && (
        <tr className="border-b">
          <td colSpan={6} className="px-3 py-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="text-xs font-medium">Servicio</label>
                <select
                  className="mt-1 w-full border rounded px-2 py-1 text-sm"
                  value={row.serviceId ?? ""}
                  onChange={(e) => setRow({ serviceId: e.target.value ? Number(e.target.value) : null, userId: null })}
                >
                  <option value="">Selecciona servicio</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium">Empleado</label>
                <select
                  className="mt-1 w-full border rounded px-2 py-1 text-sm"
                  value={row.userId ?? ""}
                  onChange={(e) => setRow({ userId: e.target.value || null })}
                  disabled={!row.serviceId || assLoading}
                >
                  <option value="">{assLoading ? "Cargando..." : "Selecciona empleado"}</option>
                  {assignees.map((u) => (
                    <option key={u.userId} value={u.userId}>
                      {u.firstName} {u.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium">Fecha</label>
                <input
                  type="date"
                  className="mt-1 w-full border rounded px-2 py-1 text-sm"
                  value={row.date}
                  onChange={(e) => setRow({ date: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium">Hora</label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    step={1800}
                    className="mt-1 w-full border rounded px-2 py-1 text-sm"
                    value={row.time}
                    onChange={(e) => setRow({ time: e.target.value })}
                  />
                  <button
                    type="button"
                    className="mt-1 px-3 py-1 border rounded text-sm"
                    onClick={fetchSlots}
                    disabled={!row.userId || !row.date || slotsLoading}
                  >
                    {slotsLoading ? "..." : "Disponibilidad"}
                  </button>
                </div>
              </div>
            </div>

            {slots.length > 0 && (
              <div className="mt-3">
                <div className="text-xs mb-1">Slots disponibles:</div>
                <div className="flex flex-wrap gap-2">
                  {slots.map((s) => {
                    const d = new Date(s.start);
                    const hh = String(d.getHours()).padStart(2, "0");
                    const mm = String(d.getMinutes()).padStart(2, "0");
                    const val = `${hh}:${mm}`;
                    return (
                      <button
                        key={s.start}
                        type="button"
                        className={`px-3 py-1 border rounded text-xs ${row.time === val ? "bg-muted" : ""}`}
                        onClick={() => setRow({ time: val })}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50 text-sm"
                onClick={onConvert}
                disabled={!canConvert || row.converting || row.done}
              >
                {row.converting ? "Convirtiendo..." : row.done ? "Convertida" : "Guardar"}
              </button>
              {row.error && <div className="text-xs text-destructive">{row.error}</div>}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}