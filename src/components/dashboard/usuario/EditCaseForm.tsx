"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export default function EditCaseForm({ caseId, initial, appointments }: { caseId: number; initial: { nombre: string; asunto: string; descripcion: string | null; clientId: string; appointmentId: number | null; clients: Array<{ userId: string; name: string }> }; appointments: Array<{ id: number; label: string }> }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(initial.nombre);
  const [asunto, setAsunto] = useState(initial.asunto);
  const [descripcion, setDescripcion] = useState(initial.descripcion ?? "");
  const [clientId, setClientId] = useState(initial.clientId);
  const [appointmentId, setAppointmentId] = useState<string>(initial.appointmentId ? String(initial.appointmentId) : "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/casos/${caseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, asunto, descripcion, clientId, appointmentId: appointmentId || undefined }),
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error || "Error al actualizar el caso");
      router.push(`/dashboard/usuario/casos/${caseId}`);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function onUploadComplete(res: Array<{ name: string; url: string; key: string }> | undefined) {
    setUploadError(null);
    try {
      if (!res || res.length === 0) return;
      for (const file of res) {
        const payload = { fileKey: file.key, fileName: file.name, fileUrl: file.url };
        const r = await fetch(`/api/casos/${caseId}/documentos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await r.json();
        if (!data?.ok) throw new Error(data?.error || "Error registrando documento");
      }
    } catch (err: any) {
      setUploadError(err?.message || String(err));
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <div className="rounded border border-red-300 bg-red-50 text-red-800 px-3 py-2 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground">Nombre</label>
          <input className="mt-1 w-full rounded-md border px-3 py-2" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Asunto</label>
          <input className="mt-1 w-full rounded-md border px-3 py-2" value={asunto} onChange={(e) => setAsunto(e.target.value)} required />
        </div>
      </div>

      <div>
        <label className="text-sm text-muted-foreground">Descripción</label>
        <textarea className="mt-1 w-full rounded-md border px-3 py-2" rows={4} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground">Cliente</label>
          <select className="mt-1 w-full rounded-md border px-3 py-2" value={clientId} onChange={(e) => setClientId(e.target.value)} required>
            {initial.clients.map((c) => (
              <option key={c.userId} value={c.userId}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Cita (opcional)</label>
          <select className="mt-1 w-full rounded-md border px-3 py-2" value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)}>
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
        {uploadError && <div className="rounded border border-red-300 bg-red-50 text-red-800 px-3 py-2 text-sm">{uploadError}</div>}
        <UploadDropzone<OurFileRouter, "caseUploader">
          endpoint="caseUploader"
          onClientUploadComplete={onUploadComplete}
          onUploadError={(e: Error | unknown) => setUploadError(e instanceof Error ? e.message : String(e))}
        />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="rounded-md border px-3 py-2" onClick={() => router.push(`/dashboard/usuario/casos/${caseId}`)} disabled={loading}>Cancelar</button>
        <button type="submit" className="rounded-md bg-primary text-primary-foreground px-3 py-2" disabled={loading}>{loading ? "Guardando..." : "Guardar cambios"}</button>
      </div>
    </form>
  );
}