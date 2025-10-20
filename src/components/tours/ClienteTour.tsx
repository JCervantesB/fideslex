"use client";

import { Button } from "@/components/ui/button";
import { useCallback } from "react";

export default function ClienteTour({ className }: { className?: string }) {
  const startTour = useCallback(async () => {
    const { driver } = await import("driver.js");

    const citasEl = document.getElementById("tour-citas-activas");
    const crearCitaEl = document.getElementById("tour-crear-cita");
    const solicitarBtnEl = document.getElementById("btn-solicitar-cita");
    const casosEl = document.getElementById("tour-casos");

    const steps = [
      citasEl ? {
        element: citasEl,
        popover: {
          title: "Tus citas activas",
          description: "Aquí verás tus próximas citas y su estado.",
          side: "top",
          align: "start",
        },
      } : null,
      crearCitaEl ? {
        element: crearCitaEl,
        popover: {
          title: "Crear una nueva cita",
          description: "Selecciona servicio, profesional y fecha. Avanza con los pasos.",
          side: "top",
          align: "start",
        },
      } : null,
      solicitarBtnEl ? {
        element: solicitarBtnEl,
        popover: {
          title: "Confirmar solicitud",
          description: "Cuando completes los pasos, pulsa aquí para solicitar la cita.",
          side: "top",
          align: "start",
        },
      } : null,
      casosEl ? {
        element: casosEl,
        popover: {
          title: "Tus casos",
          description: "Consulta el listado de tus casos y entra a ver el detalle.",
          side: "top",
          align: "start",
        },
      } : null,
    ].filter(Boolean) as any[];

    if (steps.length === 0) return;

    const d = driver({
      overlayOpacity: 0.5,
      showProgress: true,
      allowClose: true,
      stagePadding: 6,
      animate: true,
      steps,
    });

    d.drive();
  }, []);

  return (
    <div className={className ?? "fixed bottom-6 right-6 z-40"}>
      <Button variant="secondary" size="sm" onClick={startTour} aria-label="Iniciar recorrido">
        Ver recorrido
      </Button>
    </div>
  );
}