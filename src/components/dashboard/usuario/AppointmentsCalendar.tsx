"use client";

import { useMemo } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es as esLocale } from "date-fns/locale";

// Tipos compatibles con AppointmentsTable
type Item = {
  id: number;
  startAt: string; // ISO string
  endAt: string;   // ISO string
  status: string;
  services?: string[];
  providerName?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
};

// Tipo de evento para el calendario
type CalendarEvent = { id: number; title: string; start: Date; end: Date; status: string };

const locales = {
  es: esLocale,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const messages = {
  date: "Fecha",
  time: "Hora",
  event: "Evento",
  allDay: "Todo el día",
  week: "Semana",
  work_week: "Semana laboral",
  day: "Día",
  month: "Mes",
  previous: "Anterior",
  next: "Siguiente",
  today: "Hoy",
  agenda: "Agenda",
  showMore: (total: number) => `+${total} más`,
};

function statusColor(status: string): string {
  switch (status) {
    case "pendiente":
      return "#2563eb"; // blue-600
    case "finalizado":
      return "#16a34a"; // green-600
    case "cancelado":
      return "#dc2626"; // red-600
    default:
      return "#6b7280"; // gray-500
  }
}

export default function AppointmentsCalendar({ items }: { items: Item[] }) {
  const events = useMemo<CalendarEvent[]>(() => {
    return items.map((it) => {
      const start = new Date(it.startAt);
      const end = new Date(it.endAt);
      const client = it.clientName ?? it.clientEmail ?? "Cliente";
      const services = it.services && it.services.length > 0 ? it.services.join(", ") : "Servicio";
      const provider = it.providerName ? ` · ${it.providerName}` : "";
      const title = `${client} · ${services}${provider}`;
      return {
        id: it.id,
        title,
        start,
        end,
        status: it.status,
      };
    });
  }, [items]);

  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Calendario de citas</h2>
        <div className="text-sm text-muted-foreground">
          {items.length} cita{items.length === 1 ? "" : "s"}
        </div>
      </div>
      <Calendar
        localizer={localizer}
        events={events}
        culture="es"
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        defaultView={Views.MONTH}
        messages={messages}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "70vh" }}
        eventPropGetter={(event: CalendarEvent) => {
          const bg = statusColor(event.status);
          return {
            style: {
              backgroundColor: bg,
              borderRadius: "6px",
              color: "white",
              border: "none",
              padding: "2px 6px",
            },
          };
        }}
      />
    </div>
  );
}