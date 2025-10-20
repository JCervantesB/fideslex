"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type MessageItem = {
  id: number;
  content: string;
  createdAt: string; // ISO
  authorId: string;
  authorName: string;
  authorRole: string; // "cliente" | "usuario" | "administrador"
};

export default function CaseMessages({ caseId }: { caseId: number }) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/casos/${caseId}/mensajes`, { cache: "no-store" });
        const data = await res.json();
        if (active && data?.ok) {
          setMessages(data.items as MessageItem[]);
          setTimeout(scrollToBottom, 50);
        }
      } catch (e) {
        if (active) setError("No se pudo cargar la mensajería");
      }
    })();
    return () => { active = false; };
  }, [caseId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/casos/${caseId}/mensajes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (!data?.ok) {
        throw new Error(data?.error || "Error al enviar el mensaje");
      }
      setMessages((prev) => [...prev, data.item as MessageItem]);
      setContent("");
      setTimeout(scrollToBottom, 50);
    } catch (err: any) {
      setError(err?.message || "Error inesperado al enviar el mensaje");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
    } catch {
      return iso;
    }
  };

  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Mensajería</span>
        {loading && <span className="text-xs text-muted-foreground">Enviando…</span>}
      </div>
      {error && <div className="mt-2 text-sm text-destructive">{error}</div>}

      <div ref={listRef} className="mt-2 max-h-96 overflow-y-auto flex flex-col gap-3 pr-2">
        {messages.length === 0 ? (
          <div className="text-sm text-muted-foreground">No hay mensajes todavía.</div>
        ) : (
          messages.map((m) => {
            const isUserSide = m.authorRole === "usuario" || m.authorRole === "administrador";
            const bubbleClass = isUserSide ? "bg-secondary text-secondary-foreground" : "bg-muted";
            const alignClass = isUserSide ? "items-end" : "items-start";
            return (
              <div key={m.id} className={`flex ${alignClass}`}>
                <div className={`max-w-[80%] rounded-md px-3 py-2 ${bubbleClass}`}>
                  <div className="text-xs text-muted-foreground flex justify-between gap-2">
                    <span>{m.authorName || ""} {m.authorRole ? `(${m.authorRole})` : ""}</span>
                    <span>{formatDate(m.createdAt)}</span>
                  </div>
                  <div className="mt-1 whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={onSubmit} className="mt-3 flex items-end gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe un comentario…"
          className="min-h-[72px]"
        />
        <Button type="submit" disabled={loading || !content.trim()}>
          Enviar
        </Button>
      </form>
    </div>
  );
}