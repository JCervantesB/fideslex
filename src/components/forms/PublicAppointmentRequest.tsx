"use client";

import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type ServiceItem = { id: number; nombre: string };

export default function PublicAppointmentRequest({ services }: { services: ServiceItem[] }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");

  function toStartMin(t: string): number | null {
    if (!t) return null;
    const [hh, mm] = t.split(":");
    const h = Number(hh);
    const m = Number(mm);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const startMin = toStartMin(time);
    if (!clientName || !clientEmail || !clientPhone || !serviceName || !date || startMin == null) {
      toast({ title: "Campos requeridos", description: "Completa todos los campos obligatorios.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/solicitudes-citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName, clientEmail, clientPhone, serviceName, date, startMin, message }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Error al enviar la solicitud");
      }
      toast({ title: "¡Solicitud enviada!", description: "Nos pondremos en contacto pronto." });
      // Reset form
      setClientName("");
      setClientEmail("");
      setClientPhone("");
      setServiceName("");
      setDate("");
      setTime("");
      setMessage("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-6 bg-white shadow rounded space-y-4">
      <h2 className="text-xl font-semibold">Solicitar Cita</h2>
      <p className="text-sm text-gray-600">Puedes solicitar una cita como invitado. No es necesario registrarte.</p>

      <div>
        <label className="block text-sm font-medium">Nombre</label>
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="mt-1 w-full border rounded px-3 py-2"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Teléfono</label>
          <input
            type="tel"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Servicio</label>
        <select
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          className="mt-1 w-full border rounded px-3 py-2"
          required
        >
          <option value="">Selecciona un servicio</option>
          {services.map((s) => (
            <option key={s.id} value={s.nombre}>{s.nombre}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Fecha deseada</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Hora deseada</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Mensaje (opcional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1 w-full border rounded px-3 py-2"
          rows={4}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded disabled:opacity-50"
      >
        {loading ? "Enviando..." : "Enviar solicitud"}
      </button>
    </form>
  );
}