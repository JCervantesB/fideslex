"use client";

import { useEffect, useState } from "react";

type Categoria = {
  id: number;
  nombre: string;
  descripcion: string | null;
};

export default function CategoriasCrud() {
  const [items, setItems] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newNombre, setNewNombre] = useState("");
  const [newDescripcion, setNewDescripcion] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/categorias", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error cargando categorías");
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

  async function create() {
    setError(null);
    try {
      const res = await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: newNombre, descripcion: newDescripcion || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error creando categoría");
      setNewNombre("");
      setNewDescripcion("");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function startEdit(cat: Categoria) {
    setEditingId(cat.id);
    setEditNombre(cat.nombre);
    setEditDescripcion(cat.descripcion || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditNombre("");
    setEditDescripcion("");
  }

  async function saveEdit() {
    if (!editingId) return;
    setError(null);
    try {
      const res = await fetch(`/api/categorias/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: editNombre, descripcion: editDescripcion || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error actualizando categoría");
      cancelEdit();
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function remove(id: number) {
    setError(null);
    try {
      const res = await fetch(`/api/categorias/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error eliminando categoría");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold">Crear categoría</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="border rounded px-3 py-2"
            placeholder="Nombre de la categoría"
            value={newNombre}
            onChange={(e) => setNewNombre(e.target.value)}
          />
          <input
            className="border rounded px-3 py-2 md:col-span-2"
            placeholder="Descripción (opcional)"
            value={newDescripcion}
            onChange={(e) => setNewDescripcion(e.target.value)}
          />
        </div>
        <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded" onClick={create}>Crear categoría</button>
        {error && <p className="mt-2 text-red-600">{error}</p>}
      </section>

      <section>
        <h2 className="text-xl font-semibold">Listado de categorías</h2>
        {loading ? (
          <p className="mt-2 text-gray-600">Cargando...</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1 text-left">Nombre</th>
                  <th className="border px-2 py-1 text-left">Descripción</th>
                  <th className="border px-2 py-1 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((cat) => (
                  <tr key={cat.id}>
                    <td className="border px-2 py-1">
                      {editingId === cat.id ? (
                        <input
                          className="w-full border rounded px-2 py-1"
                          value={editNombre}
                          onChange={(e) => setEditNombre(e.target.value)}
                        />
                      ) : (
                        cat.nombre
                      )}
                    </td>
                    <td className="border px-2 py-1">
                      {editingId === cat.id ? (
                        <input
                          className="w-full border rounded px-2 py-1"
                          value={editDescripcion}
                          onChange={(e) => setEditDescripcion(e.target.value)}
                        />
                      ) : (
                        cat.descripcion || ""
                      )}
                    </td>
                    <td className="border px-2 py-1 space-x-2">
                      {editingId === cat.id ? (
                        <>
                          <button className="bg-blue-600 text-white px-2 py-1 rounded" onClick={saveEdit}>Guardar</button>
                          <button className="bg-gray-500 text-white px-2 py-1 rounded" onClick={cancelEdit}>Cancelar</button>
                        </>
                      ) : (
                        <>
                          <button className="bg-blue-600 text-white px-2 py-1 rounded" onClick={() => startEdit(cat)}>Editar</button>
                          <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => remove(cat.id)}>Eliminar</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}