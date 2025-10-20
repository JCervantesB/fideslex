"use client";

import { useEffect, useState } from "react";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

type DocItem = { id: number; fileName: string; fileUrl: string };

export default function CaseDetailClient({ caseId, initialDocs }: { caseId: number; initialDocs: DocItem[] }) {
  const [docs, setDocs] = useState<DocItem[]>(initialDocs);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/casos/${caseId}/documentos`);
        const data = await res.json();
        if (active && data?.ok) {
          const nextDocs = (data.items as DocItem[]).map((d) => ({ id: d.id, fileName: d.fileName, fileUrl: d.fileUrl }));
          setDocs(nextDocs);
        }
      } catch {}
    })();
    return () => { active = false; };
  }, [caseId]);

  async function onUploadComplete(res: Array<{ name: string; url: string; key: string }> | undefined) {
    setError(null);
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
      const reload = await fetch(`/api/casos/${caseId}/documentos`);
      const reloadData = await reload.json();
      if (reloadData?.ok) {
        const nextDocs = (reloadData.items as DocItem[]).map((d) => ({ id: d.id, fileName: d.fileName, fileUrl: d.fileUrl }));
        setDocs(nextDocs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="rounded border border-red-300 bg-red-50 text-red-800 px-3 py-2 text-sm">{error}</div>}

      <div>
        <h2 className="text-lg font-semibold">Documentos</h2>
        <p className="text-muted-foreground text-sm">Sube archivos relacionados al caso.</p>
      </div>

      <UploadButton<OurFileRouter, "caseUploader">
        endpoint="caseUploader"
        onClientUploadComplete={onUploadComplete}
        onUploadError={(e: Error | unknown) => setError(e instanceof Error ? e.message : String(e))}
      />

      {docs.length === 0 ? (
        <div className="rounded border p-3 text-sm text-muted-foreground">No hay documentos.</div>
      ) : (
        <ul className="space-y-2">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between rounded border p-2">
              <span>{d.fileName}</span>
              <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-2">Ver</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}