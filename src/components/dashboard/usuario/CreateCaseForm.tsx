"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { UploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export default function CreateCaseForm({ clients, appointments }: { clients: Array<{ userId: string; name: string }>; appointments: Array<{ id: number; label: string }> }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [asunto, setAsunto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [clientId, setClientId] = useState(clients[0]?.userId ?? "");
  const [appointmentId, setAppointmentId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ key: string; name: string; url: string }>>([]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/casos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, asunto, descripcion, clientId, appointmentId: appointmentId || null, files: uploadedFiles }),
      });
      const data = await res.json();
      if (!data?.ok) {
        throw new Error(data?.error || "Error al crear el caso");
      }
      router.push(`/dashboard/usuario/casos/${data.item.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <div className="rounded border border-red-300 bg-red-50 text-red-800 px-3 py-2 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground">Nombre</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="Nombre del caso"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Asunto</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="Asunto"
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-muted-foreground">Descripción</label>
        <textarea
          className="mt-1 w-full rounded-md border px-3 py-2"
          placeholder="Descripción del caso (opcional)"
          rows={4}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground">Cliente</label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
          >
            {clients.map((c) => (
              <option key={c.userId} value={c.userId}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Cita (opcional)</label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={appointmentId}
            onChange={(e) => setAppointmentId(e.target.value)}
          >
            <option value="">Sin cita</option>
            {appointments.map((a) => (
              <option key={a.id} value={String(a.id)}>{a.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Documentos</h2>
        <p className="text-muted-foreground text-sm">Arrastra y suelta o haz clic para subir archivos.</p>
        <UploadDropzone<OurFileRouter, "caseUploader">
          endpoint="caseUploader"
          onClientUploadComplete={(res) => {
            if (!res) return;
            setUploadedFiles((prev) => [...prev, ...res]);
          }}
          onUploadError={(e: Error | unknown) => setError(e instanceof Error ? e.message : String(e))}
        />
        {uploadedFiles.length > 0 && (
          <ul className="mt-2 text-sm text-muted-foreground space-y-1">
            {uploadedFiles.map((f, idx) => <li key={f.key + idx}>{f.name}</li>)}
          </ul>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="rounded-md border px-3 py-2"
          onClick={() => router.push("/dashboard/usuario/casos")}
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="rounded-md bg-primary text-primary-foreground px-3 py-2"
          disabled={loading}
        >
          {loading ? "Creando..." : "Crear caso"}
        </button>
      </div>
    </form>
  );
}