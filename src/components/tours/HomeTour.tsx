"use client";

import { Button } from "@/components/ui/button";
import { useCallback } from "react";

export default function HomeTour({ className }: { className?: string }) {
  const startTour = useCallback(async () => {
    const { driver } = await import("driver.js");

    const accEl = document.getElementById("btn-acceder") ?? document.getElementById("btn-acceder-mobile");
    const citaEl = document.getElementById("btn-agendar-cita") ?? document.getElementById("btn-agendar-cita-mobile");
    const formEl = document.getElementById("contact-form");

    const steps = [
      accEl ? { element: accEl, popover: { title: "Acceder o registrarse", description: "Desde aquí puedes acceder o crear tu cuenta. Necesitas tener una cuenta para agendar una cita.", side: "bottom", align: "start" } } : null,
      citaEl ? { element: citaEl, popover: { title: "Agendar cita", description: "Solicita agendar rápidamente una cita desde este botón. Estas citas tendran que ser validadas y confirmadas por un profesional.", side: "bottom", align: "start" } } : null,
      formEl ? { element: formEl, popover: { title: "Formulario de contacto", description: "También puedes solicitar una cita llenando este formulario. Estas citas tendran que ser validadas y confirmadas por un profesional.", side: "top", align: "start" } } : null,
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
    <div className={className ?? "absolute top-6 right-6 z-50"}>
      <Button variant="secondary" size="sm" onClick={startTour} aria-label="Iniciar recorrido">
        Ver recorrido
      </Button>
    </div>
  );
}