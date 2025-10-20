"use client";

import { useMemo, useEffect, useState } from "react";

type Item = {
  id: number;
  startAt: string; // ISO string
  endAt: string;   // ISO string
  status: string;
  providerName: string;
};

type Props = {
  items: Item[];
};

export default function MyAppointments({ items }: Props) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [items]);

  if (!isClient) return null;

  return (
    <div id="tour-citas-activas" className="rounded-md border p-4 space-y-4">
      <h2 className="text-xl font-semibold">Tus citas</h2>
      {sorted.length === 0 ? (
        <div className="text-sm text-muted-foreground">No tienes citas programadas.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-md">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3">Fecha</th>
                <th className="text-left p-3">Hora</th>
                <th className="text-left p-3">Con</th>
                <th className="text-left p-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((it) => {
                const start = new Date(it.startAt);
                const dateLabel = `${start.toLocaleDateString()}`;
                const timeLabel = `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
                return (
                  <tr key={it.id} className="border-b">
                    <td className="p-3">{dateLabel}</td>
                    <td className="p-3">{timeLabel}</td>
                    <td className="p-3">{it.providerName}</td>
                    <td className="p-3">{it.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}