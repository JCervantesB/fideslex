"use client";

import { useEffect, useState, Fragment } from "react";

type Servicio = {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: string; // numeric en drizzle se maneja como string
  estado: string;
};

type Perfil = {
  userId: string;
  firstName: string;
  lastName: string;
  role: string;
};

type Categoria = {
  id: number;
  nombre: string;
  descripcion: string | null;
};

export default function ServiciosCrud() {
  const [items, setItems] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<{ nombre: string; descripcion: string; precio: string; estado: string }>({
    nombre: "",
    descripcion: "",
    precio: "0",
    estado: "activo",
  });

  const [editingId, setEditingId] = useState<number | null>(null);

  const [lawyers, setLawyers] = useState<Perfil[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  // Nuevo estado: selección de categorías al crear servicio y creación inline
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedLawyerIds, setSelectedLawyerIds] = useState<string[]>([]);
  function toggleLawyerSelection(userId: string) {
    setSelectedLawyerIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  }
  const [createCatName, setCreateCatName] = useState<string>("");
  const [createCatDesc, setCreateCatDesc] = useState<string>("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/servicios", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Error cargando servicios");
      }
      setItems(data.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadLawyers();
  }, []);

  async function create() {
    setError(null);
    try {
      const res = await fetch("/api/servicios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          descripcion: form.descripcion || null,
          precio: Number(form.precio),
          estado: form.estado,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error creando servicio");

      // Asignar categorías seleccionadas si existen
      const servicioId = Number(data?.item?.id);
      if (servicioId && selectedCategoryIds.length > 0) {
        const ids = selectedCategoryIds.map((v) => Number(v)).filter(Boolean);
        await Promise.all(
          ids.map((categoryId) =>
            fetch(`/api/servicios/${servicioId}/categorias`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ categoryId }),
            }).then(async (r) => {
              const j = await r.json();
              if (!r.ok) throw new Error(j?.error || "Error asignando categoría");
            })
          )
        );
      }

      // Asignar abogados seleccionados si existen
      if (servicioId && selectedLawyerIds.length > 0) {
        await Promise.all(
          selectedLawyerIds.map((userId) =>
            fetch(`/api/servicios/${servicioId}/usuarios`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId }),
            }).then(async (r) => {
              const j = await r.json();
              if (!r.ok) throw new Error(j?.error || "Error asignando abogado");
            })
          )
        );
      }

      setForm({ nombre: "", descripcion: "", precio: "0", estado: "activo" });
      setSelectedCategoryIds([]);
      setSelectedLawyerIds([]);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function startEdit(item: Servicio) {
    setEditingId(item.id);
    setForm({
      nombre: item.nombre,
      descripcion: item.descripcion || "",
      precio: item.precio,
      estado: item.estado,
    });
    // Cargar asignaciones actuales para prefijar selección
    const [ass, cats] = await Promise.all([
      loadAssignments(item.id),
      loadCategoryAssignments(item.id),
    ]);
    setSelectedLawyerIds((ass || []).map((a) => a.userId));
    setSelectedCategoryIds((cats || []).map((c) => String(c.id)));
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ nombre: "", descripcion: "", precio: "0", estado: "activo" });
    setSelectedCategoryIds([]);
    setSelectedLawyerIds([]);
  }

  async function saveEdit() {
    if (!editingId) return;
    setError(null);
    try {
      const res = await fetch(`/api/servicios/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          descripcion: form.descripcion || null,
          precio: Number(form.precio),
          estado: form.estado,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error actualizando servicio");

      // Sincronizar abogados
      const currentAss = await loadAssignments(editingId);
      const currentUserIds = (currentAss || []).map((a) => a.userId);
      const toAddUsers = selectedLawyerIds.filter((id) => !currentUserIds.includes(id));
      const toRemoveUsers = currentUserIds.filter((id) => !selectedLawyerIds.includes(id));
      await Promise.all([
        ...toAddUsers.map((userId) =>
          fetch(`/api/servicios/${editingId}/usuarios`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          }).then(async (r) => {
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error || "Error asignando abogado");
          })
        ),
        ...toRemoveUsers.map((userId) =>
          fetch(`/api/servicios/${editingId}/usuarios/${userId}`, { method: "DELETE" }).then(async (r) => {
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error || "Error desasignando abogado");
          })
        ),
      ]);

      // Sincronizar categorías
      const currentCats = await loadCategoryAssignments(editingId);
      const currentCatIds = (currentCats || []).map((c) => String(c.id));
      const toAddCats = selectedCategoryIds.filter((id) => !currentCatIds.includes(id));
      const toRemoveCats = currentCatIds.filter((id) => !selectedCategoryIds.includes(id));
      await Promise.all([
        ...toAddCats.map((id) =>
          fetch(`/api/servicios/${editingId}/categorias`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ categoryId: Number(id) }),
          }).then(async (r) => {
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error || "Error asignando categoría");
          })
        ),
        ...toRemoveCats.map((id) =>
          fetch(`/api/servicios/${editingId}/categorias/${id}`, { method: "DELETE" }).then(async (r) => {
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error || "Error desasignando categoría");
          })
        ),
      ]);

      setEditingId(null);
      setForm({ nombre: "", descripcion: "", precio: "0", estado: "activo" });
      setSelectedCategoryIds([]);
      setSelectedLawyerIds([]);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function remove(id: number) {
    setError(null);
    try {
      const res = await fetch(`/api/servicios/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error eliminando servicio");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function loadLawyers() {
    try {
      const res = await fetch("/api/usuarios", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error cargando usuarios");
      const list = (data.items || []) as Perfil[];
      setLawyers(list.filter((p) => p.role === "usuario" || p.role === "administrador"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function loadAssignments(serviceId: number): Promise<Perfil[]> {
    try {
      const res = await fetch(`/api/servicios/${serviceId}/usuarios`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error cargando asignaciones");
      const items = (data.items || []) as Perfil[];
      return items;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      return [] as Perfil[];
    }
  }

  async function loadCategories() {
    try {
      const res = await fetch(`/api/categorias`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error cargando categorías");
      setCategories(data.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }











  async function loadCategoryAssignments(serviceId: number): Promise<Categoria[]> {
    try {
      const res = await fetch(`/api/servicios/${serviceId}/categorias`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error cargando categorías del servicio");
      const items = (data.items || []) as Categoria[];
      return items;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      return [] as Categoria[];
    }
  }











  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold">Servicio</h2>
        <div className="mt-4 grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre del servicio</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              placeholder="Ej: Consulta jurídica inicial"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            />
            <p className="mt-1 text-xs text-gray-500">Nombre claro y fácil de reconocer.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                className="mt-1 w-full border rounded px-3 py-2"
                rows={3}
                placeholder="Resumen del servicio, alcance y requisitos"
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              />
              <p className="mt-1 text-xs text-gray-500">Ayuda a tus clientes a entender exactamente qué incluye.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Precio</label>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="0.00"
                type="number"
                step="0.01"
                value={form.precio}
                onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))}
              />
              <p className="mt-1 text-xs text-gray-500">Introduce el precio en tu moneda.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <select
                className="mt-1 w-full border rounded px-3 py-2"
                value={form.estado}
                onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Categorías</label>
              {categories.length > 0 ? (
                <select
                  multiple
                  className="mt-1 w-full border rounded px-3 py-2 h-32"
                  value={selectedCategoryIds}
                  onChange={(e) =>
                    setSelectedCategoryIds(Array.from(e.target.selectedOptions).map((o) => o.value))
                  }
                >
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="mt-1 rounded border border-yellow-300 bg-yellow-50 text-yellow-800 px-3 py-2">
                  No hay categorías disponibles. Crea una nueva a continuación.
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">Puedes seleccionar varias categorías con Ctrl/Cmd.</p>
            </div>
          </div>

          <div className="grid grid-cols-1">
            <div>
              <label className="block text-sm font-medium text-gray-700">Abogados</label>
              {lawyers.length > 0 ? (
                <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {lawyers.map((l) => {
                    const selected = selectedLawyerIds.includes(l.userId);
                    return (
                      <button
                        type="button"
                        key={l.userId}
                        onClick={() => toggleLawyerSelection(l.userId)}
                        aria-pressed={selected}
                        className={`text-left border rounded px-3 py-2 transition-colors ${selected ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-900 hover:bg-gray-50"}`}
                      >
                        {l.firstName} {l.lastName} ({l.role})
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-1 rounded border border-yellow-300 bg-yellow-50 text-yellow-800 px-3 py-2">
                  No hay perfiles disponibles.
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">Haz clic para seleccionar/deseleccionar. Los seleccionados se resaltan.</p>
            </div>
          </div>

          <div className="border-t pt-4 hidden">
            <h3 className="text-sm font-semibold text-gray-800">¿No encuentras la categoría? Crea una nueva</h3>

            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="border rounded px-3 py-2"
                placeholder="Nombre de la categoría"
                value={createCatName}
                onChange={(e) => setCreateCatName(e.target.value)}
              />
              <input
                className="border rounded px-3 py-2 md:col-span-2"
                placeholder="Descripción (opcional)"
                value={createCatDesc}
                onChange={(e) => setCreateCatDesc(e.target.value)}
              />
            </div>
            <button
              className="mt-2 bg-gray-800 text-white px-3 py-2 rounded"
              onClick={async () => { /* oculto */ }}
            >
              Crear y seleccionar
            </button>
          </div>
        </div>
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded" onClick={editingId ? saveEdit : create}>{editingId ? "Guardar cambios" : "Crear servicio"}</button>
        {editingId && (
          <button className="mt-4 ml-2 bg-gray-500 text-white px-4 py-2 rounded" onClick={cancelEdit}>Cancelar edición</button>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold">Listado de servicios</h2>
        {loading ? (
          <p className="mt-2 text-gray-600">Cargando...</p>
        ) : error ? (
          <p className="mt-2 text-red-600">{error}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1 text-left">Nombre</th>
                  <th className="border px-2 py-1 text-left">Precio</th>
                  <th className="border px-2 py-1 text-left">Estado</th>
                  <th className="border px-2 py-1 text-left">Descripción</th>
                  <th className="border px-2 py-1 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <Fragment key={item.id}>
                    <tr key={item.id}>
                      <td className="border px-2 py-1">{item.nombre}</td>
                      <td className="border px-2 py-1">{item.precio}</td>
                      <td className="border px-2 py-1">{item.estado}</td>
                      <td className="border px-2 py-1">{item.descripcion || ""}</td>
                      <td className="border px-2 py-1 space-x-2">
                        <button className="bg-blue-600 text-white px-2 py-1 rounded" onClick={() => startEdit(item)}>Editar</button>
                        <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => remove(item.id)}>Eliminar</button>
                      </td>
                    </tr>

                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}