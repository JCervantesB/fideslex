"use client";

import { useState } from "react";
import ServiciosCrud from "./ServiciosCrud";
import CategoriasCrud from "./CategoriasCrud";

export default function ServiciosCategoriasTabs() {
  const [tab, setTab] = useState<"servicios" | "categorias">("servicios");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b pb-2">
        <button
          type="button"
          onClick={() => setTab("servicios")}
          className={`px-3 py-2 rounded ${tab === "servicios" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}
        >
          Servicios
        </button>
        <button
          type="button"
          onClick={() => setTab("categorias")}
          className={`px-3 py-2 rounded ${tab === "categorias" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}
        >
          Categorías
        </button>
      </div>

      {tab === "servicios" ? (
        <div>
          <h2 className="text-xl font-semibold mb-2">Crear y modificar servicios</h2>
          <ServiciosCrud />
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-2">Crear y modificar categorías</h2>
          <CategoriasCrud />
        </div>
      )}
    </div>
  );
}