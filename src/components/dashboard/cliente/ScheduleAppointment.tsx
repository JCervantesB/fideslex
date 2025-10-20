"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Service = { id: number; nombre: string };

type Provider = { userId: string; firstName: string; lastName: string };

type ServiceGroup = { nombre: string; services: Service[] };

type Props = {
  groups: ServiceGroup[];
};

export default function ScheduleAppointment({ groups }: Props) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const today = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const allServices = useMemo(() => groups.flatMap((g) => g.services), [groups]);
  // No preseleccionar servicio por defecto
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [date, setDate] = useState<string>(today);
  const [slots, setSlots] = useState<Array<{ start: string; end: string }>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [step, setStep] = useState<number>(1);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState<string>("");

  // Secciones colapsables por categoría
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setOpenGroups((prev) => {
      const hasAnyTrue = Object.values(prev).some(Boolean);
      const next: Record<string, boolean> = {};
      groups.forEach((g, i) => {
        next[g.nombre] = hasAnyTrue ? (prev[g.nombre] ?? false) : i === 0; // abrir primera por defecto si ninguna está abierta aún
      });
      return next;
    });
  }, [groups]);

  // Cargar profesionales según servicio (sin avanzar pasos ni preseleccionar)
  useEffect(() => {
    let active = true;
    async function loadProviders() {
      setProviders([]);
      setUserId("");
      setSelectedSlot(null);
      if (!serviceId) return;
      try {
        // Ajuste: usar endpoint existente de usuarios asignados al servicio
        const res = await fetch(`/api/servicios/${serviceId}/usuarios`);
        const data = await res.json();
        if (!active) return;
        if (data?.ok) {
          const items = data.items as Provider[];
          setProviders(items);
          // No preseleccionar profesional
        } else {
          setMessage(data?.error ?? "Error cargando profesionales");
        }
      } catch (err) {
        if (!active) return;
        setMessage("Error de red cargando profesionales");
      }
    }
    loadProviders();
    return () => {
      active = false;
    };
  }, [serviceId]);

  // Cargar disponibilidad según profesional y fecha
  useEffect(() => {
    let active = true;
    async function loadSlots() {
      if (!userId || !date) return;
      setLoading(true);
      setMessage("");
      setSelectedSlot(null);
      try {
        const res = await fetch(`/api/disponibilidad?userId=${encodeURIComponent(userId)}&date=${encodeURIComponent(date)}`);
        const data = await res.json();
        if (!active) return;
        if (data?.ok) {
          setSlots(data.slots ?? []);
        } else {
          setMessage(data?.error ?? "No hay disponibilidad para ese día");
        }
      } catch (err) {
        if (!active) return;
        setMessage("Error de red cargando disponibilidad");
      } finally {
        setLoading(false);
      }
    }
    loadSlots();
    return () => {
      active = false;
    };
  }, [userId, date]);

  // Paso 1: elegir servicio (secciones colapsables por categoría)
  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">1. Elige el servicio</h2>
      <p className="text-sm text-muted-foreground">Abra una categoría y toque el servicio. Luego pulse “Siguiente”.</p>
      {groups.length === 0 && (
        <p className="text-muted-foreground">No hay servicios disponibles.</p>
      )}
      {groups.map((group) => (
        <div key={group.nombre} className="border rounded">
          <button
            type="button"
            className="flex items-center justify-between w-full px-3 py-2"
            onClick={() => setOpenGroups((prev) => ({ ...prev, [group.nombre]: !prev[group.nombre] }))}
          >
            <span className="text-lg font-medium">{group.nombre}</span>
            <span className="text-sm text-gray-600">{openGroups[group.nombre] ? "Ocultar" : "Mostrar"}</span>
          </button>
          {openGroups[group.nombre] && (
            <div className="px-3 pb-3">
              {group.services.length === 0 ? (
                <p className="text-muted-foreground">No hay servicios en esta categoría.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {group.services.map((s) => (
                    <Button
                      key={s.id}
                      variant={serviceId === s.id ? "default" : "outline"}
                      onClick={() => setServiceId(s.id)}
                      className="justify-start"
                    >
                      {s.nombre}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <Button disabled={!serviceId} onClick={() => setStep(2)}>Siguiente</Button>
      </div>
    </div>
  );

  // Paso 2: elegir profesional y fecha
  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">2. Elige profesional y fecha</h2>
      <p className="text-sm text-muted-foreground">Primero elija el profesional y después la fecha.</p>
      <p className="text-sm text-muted-foreground">Atendemos de lunes a viernes, 9:00 a 16:00.</p>
      {providers.length === 0 ? (
        <p className="text-muted-foreground">No hay profesionales disponibles para este servicio.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {providers.map((p) => (
            <Button key={p.userId} variant={userId === p.userId ? "default" : "outline"} onClick={() => setUserId(p.userId)}>
              {p.firstName} {p.lastName}
            </Button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Fecha</label>
        <Input
          type="date"
          value={date}
          onChange={(e) => {
            const newDate = e.target.value;
            setDate(newDate);
            if (isWeekend(newDate)) {
              setMessage("Solo damos turnos de lunes a viernes.");
            } else {
              setMessage("");
            }
          }}
        />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
        <Button disabled={!userId} onClick={() => setStep(3)}>Siguiente</Button>
      </div>
    </div>
  );

  // Paso 3: elegir franja y confirmar
  const renderStep3 = () => {
    const svcName = allServices.find((s) => s.id === serviceId)?.nombre ?? "Servicio";
    const providerName = providers.find((p) => p.userId === userId)
      ? `${providers.find((p) => p.userId === userId)!.firstName} ${providers.find((p) => p.userId === userId)!.lastName}`
      : "Profesional";

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">3. Elige horario y confirma</h2>

        {loading && <p className="text-muted-foreground">Cargando disponibilidad…</p>}
        {!loading && slots.length === 0 && (
          <p className="text-muted-foreground">No hay turnos ese día. Elija otra fecha de lunes a viernes.</p>
        )}

        {!loading && slots.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {slots.map((slot) => {
              const label = `De ${formatHour(slot.start)} a ${formatHour(slot.end)} (30 min)`;
              const value = `${slot.start}|${slot.end}`;
              return (
                <Button
                  key={value}
                  variant={selectedSlot === value ? "default" : "outline"}
                  className="text-base py-3"
                  onClick={() => setSelectedSlot(value)}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Servicio: {svcName}</p>
          <p className="text-sm text-muted-foreground">Profesional: {providerName}</p>
          <p className="text-sm text-muted-foreground">Fecha: {formatDate(date)}</p>
          <p className="text-sm text-muted-foreground">
            Horario: {selectedSlot ? `De ${formatHour(selectedSlot.split("|")[0])} a ${formatHour(selectedSlot.split("|")[1])}` : "—"}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Mensaje para el equipo (opcional)</label>
          <Textarea
            placeholder="Cuéntanos brevemente el motivo de tu visita"
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.target.value)}
          />
        </div>

        {message && <p className="text-destructive">{message}</p>}

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep(2)}>Atrás</Button>
          <Button
             disabled={!selectedSlot || !serviceId || !userId}
             onClick={async () => {
               if (!selectedSlot || !serviceId || !userId) return;
               const [startIso] = selectedSlot.split("|");
               const dayStartMs = new Date(`${date}T00:00:00`).getTime();
               const startMin = Math.round((new Date(startIso).getTime() - dayStartMs) / 60000);
               setLoading(true);
               try {
                 // Adaptación: crear una solicitud de cita en lugar de una cita directa
                 const res = await fetch("/api/solicitudes-citas", {
                   method: "POST",
                   headers: { "Content-Type": "application/json" },
                   body: JSON.stringify({
                     serviceName: svcName,
                     date,
                     startMin,
                     message: requestMessage,
                   }),
                 });
                 const data = await res.json();
                 if (data?.ok) {
                   setMessage("Solicitud registrada correctamente");
                 } else {
                   setMessage(data?.error ?? "Error registrando la solicitud");
                 }
               } catch (err) {
                 setMessage("Error de red registrando la solicitud");
               } finally {
                 setLoading(false);
               }
             }}
           >
             Solicitar cita
           </Button>
        </div>
      </div>
    );
  };

  if (!isClient) return null;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-muted-foreground">
          Siga estos pasos sencillos para sacar su turno.
        </p>
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  );
}


const isWeekend = (dateStr: string) => {
  const day = new Date(`${dateStr}T00:00:00`).getDay();
  return day === 0 || day === 6;
};
const formatHour = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false });
const formatDate = (dateStr: string) =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });