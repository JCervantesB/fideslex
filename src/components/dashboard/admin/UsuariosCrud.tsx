"use client";

import { useEffect, useState } from "react";

type Perfil = {
  userId: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
};

type Schedule = { id: number; startMin: number; endMin: number };

function formatHour(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function UsuariosCrud() {
  const [items, setItems] = useState<Perfil[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [roleFilter, setRoleFilter] = useState<'todos' | 'cliente' | 'usuario' | 'administrador'>('todos');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ firstName: string; lastName: string; phone: string; role: string }>({ firstName: "", lastName: "", phone: "", role: "usuario" });

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [lunchStartMin, setLunchStartMin] = useState<number | null>(null);
  const [lunchLoading, setLunchLoading] = useState(false);
  const [lunchSaving, setLunchSaving] = useState(false);
  // Mapa de comida por usuario para mostrar en vista (no edición)
  const [lunchByUser, setLunchByUser] = useState<Record<string, number | null>>({});

  async function load(filterRole?: 'todos' | 'cliente' | 'usuario' | 'administrador') {
    setError(null);
    setLoading(true);
    try {
      const url = filterRole && filterRole !== 'todos' ? `/api/usuarios?role=${filterRole}` : "/api/usuarios";
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error cargando usuarios");
      const loaded: Perfil[] = (data.items || []) as Perfil[];
      setItems(loaded);
      // Cargar comida para usuarios del listado (solo roles con comida)
      await fetchLunchesForUsers(loaded);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(roleFilter);
  }, [roleFilter]);

  async function loadSchedules() {
    setSchedulesLoading(true);
    try {
      const res = await fetch('/api/horarios', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error cargando horarios');
      const items: Schedule[] = data.items || [];
      // posibles inicios de comida: 09:00–15:00 (1h)
      const filtered = items.filter((h) => h.startMin >= 540 && h.startMin <= 900);
      // ordenar por inicio
      filtered.sort((a, b) => a.startMin - b.startMin);
      setSchedules(filtered);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSchedulesLoading(false);
    }
  }

  async function fetchLunchesForUsers(users: Perfil[]) {
    const ids = users
      .filter((u) => u.role === 'usuario' || u.role === 'administrador')
      .map((u) => u.userId);
    if (ids.length === 0) {
      setLunchByUser({});
      return;
    }
    const entries = await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await fetch(`/api/usuarios/${id}/comida`, { cache: 'no-store' });
          const data = await res.json();
          const startMin = res.ok ? (data?.item?.startMin ?? null) : null;
          return [id, startMin] as const;
        } catch {
          return [id, null] as const;
        }
      })
    );
    setLunchByUser((prev) => {
      const next = { ...prev };
      for (const [id, startMin] of entries) {
        next[id] = startMin;
      }
      return next;
    });
  }

  async function loadLunch(userId: string) {
    setLunchLoading(true);
    try {
      const res = await fetch(`/api/usuarios/${userId}/comida`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error cargando comida');
      const item = data.item;
      setLunchStartMin(item?.startMin ?? null);
      setLunchByUser((prev) => ({ ...prev, [userId]: item?.startMin ?? null }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLunchLoading(false);
    }
  }

  function startEdit(u: Perfil) {
    setEditingId(u.userId);
    setEditForm({ firstName: u.firstName, lastName: u.lastName, phone: u.phone, role: u.role });
    // cargar horarios y comida solo si el rol aplica
    if (u.role === 'usuario' || u.role === 'administrador') {
      loadSchedules();
      loadLunch(u.userId);
    } else {
      setLunchStartMin(null);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setLunchStartMin(null);
  }

  async function saveInfo() {
    if (!editingId) return;
    setError(null);
    try {
      const res = await fetch(`/api/usuarios/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: editForm.firstName, lastName: editForm.lastName, phone: editForm.phone, role: editForm.role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error actualizando información");
      setEditingId(null);
      await load(roleFilter);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function saveLunch() {
    if (!editingId || lunchStartMin == null) return;
    setLunchSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/usuarios/${editingId}/comida`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startMin: lunchStartMin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error guardando comida');
      setLunchByUser((prev) => ({ ...prev, [editingId]: lunchStartMin }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLunchSaving(false);
    }
  }

  async function removeLunch() {
    if (!editingId) return;
    setLunchSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/usuarios/${editingId}/comida`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error eliminando comida');
      setLunchStartMin(null);
      setLunchByUser((prev) => ({ ...prev, [editingId]: null }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLunchSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Usuarios</h2>
      {error && <div className="rounded border border-red-300 bg-red-50 text-red-800 px-3 py-2">{error}</div>}
      {loading ? (
        <p className="text-gray-600">Cargando...</p>
      ) : items.length === 0 ? (
        <div className="rounded border p-3 text-gray-700">No hay usuarios disponibles.</div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Filtrar por rol:</label>
            <select
              className="border rounded px-2 py-1"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'todos' | 'cliente' | 'usuario' | 'administrador')}
            >
              <option value="todos">Todos</option>
              <option value="cliente">Cliente</option>
              <option value="usuario">Usuario</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                 <tr className="bg-gray-100">
                   <th className="border px-2 py-1 text-left">Nombre</th>
                   <th className="border px-2 py-1 text-left">Teléfono</th>
                   <th className="border px-2 py-1 text-left">Rol</th>
                   <th className="border px-2 py-1 text-left">Comida (1h)</th>
                   <th className="border px-2 py-1 text-left">Acciones</th>
                 </tr>
               </thead>
              <tbody>
                {items.map((u) => {
                  const isEditing = editingId === u.userId;
                  const roleIsStaff = (isEditing ? editForm.role : u.role) === 'usuario' || (isEditing ? editForm.role : u.role) === 'administrador';
                  return (
                    <tr key={u.userId} className="align-middle">
                      <td className="border px-2 py-1">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <input
                              className="border rounded px-2 py-1 w-40"
                              value={editForm.firstName}
                              onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                              placeholder="Nombre"
                            />
                            <input
                              className="border rounded px-2 py-1 w-40"
                              value={editForm.lastName}
                              onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                              placeholder="Apellido"
                            />
                          </div>
                        ) : (
                          <span>{u.firstName} {u.lastName}</span>
                        )}
                      </td>
                      <td className="border px-2 py-1">
                        {isEditing ? (
                          <input
                            className="border rounded px-2 py-1 w-40"
                            value={editForm.phone}
                            onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                            placeholder="Teléfono"
                          />
                        ) : (
                          <span>{u.phone}</span>
                        )}
                      </td>
                      <td className="border px-2 py-1">
                         {isEditing ? (
                           <select
                             className="border rounded px-2 py-1"
                             value={editForm.role}
                             onChange={(e) => {
                               const newRole = e.target.value;
                               setEditForm((f) => ({ ...f, role: newRole }));
                               if (newRole === 'usuario' || newRole === 'administrador') {
                                 loadSchedules();
                                 loadLunch(u.userId);
                               } else {
                                 setLunchStartMin(null);
                               }
                             }}
                           >
                             <option value="cliente">Cliente</option>
                             <option value="usuario">Usuario</option>
                             <option value="administrador">Administrador</option>
                           </select>
                         ) : (
                           <span>{u.role}</span>
                         )}
                       </td>

                      <td className="border px-2 py-1">
                        {roleIsStaff ? (
                          isEditing ? (
                            <div className="flex items-center gap-2">
                              <select
                                className="border rounded px-2 py-1"
                                value={lunchStartMin ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? null : Number(e.target.value);
                                  setLunchStartMin(val);
                                }}
                                disabled={schedulesLoading || lunchLoading || lunchSaving}
                              >
                                <option value="">Sin comida</option>
                                {schedules.map((s) => {
                                  const start = s.startMin;
                                  const end = start + 60;
                                  const label = `De ${formatHour(start)} a ${formatHour(end)}`;
                                  return (
                                    <option key={s.id} value={start}>{label}</option>
                                  );
                                })}
                              </select>
                              <button
                                className="bg-blue-600 text-white px-3 py-1 rounded"
                                onClick={saveLunch}
                                disabled={lunchStartMin == null || lunchSaving}
                              >
                                Guardar comida
                              </button>
                              <button
                                className="bg-red-600 text-white px-3 py-1 rounded"
                                onClick={removeLunch}
                                disabled={lunchSaving}
                              >
                                Quitar comida
                              </button>
                            </div>
                          ) : (
                            lunchByUser[u.userId] != null ? (
                              <span>{`De ${formatHour(lunchByUser[u.userId] as number)} a ${formatHour((lunchByUser[u.userId] as number) + 60)}`}</span>
                            ) : (
                              <span className="text-gray-600">Sin comida</span>
                            )
                          )
                        ) : (
                          <span className="text-gray-600">No aplica</span>
                        )}
                      </td>

                      <td className="border px-2 py-1">
                        <div className="flex gap-2">
                          {isEditing ? (
                            <>
                              <button
                                className="bg-green-600 text-white px-3 py-1 rounded"
                                onClick={saveInfo}
                              >
                                Guardar cambios
                              </button>
                              <button
                                className="bg-gray-300 text-gray-900 px-3 py-1 rounded"
                                onClick={cancelEdit}
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <button
                              className="bg-yellow-500 text-white px-3 py-1 rounded"
                              onClick={() => startEdit(u)}
                            >
                              Editar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}