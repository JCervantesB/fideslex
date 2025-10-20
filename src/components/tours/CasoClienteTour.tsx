"use client";

import { Button } from "@/components/ui/button";
import { useCallback } from "react";

export default function CasoClienteTour({ className }: { className?: string }) {
  const startTour = useCallback(async () => {
    const { driver } = await import("driver.js");

    const tituloEl = document.getElementById("tour-caso-titulo");
    const descripcionEl = document.getElementById("tour-caso-descripcion");
    const mensajesEl = document.getElementById("tour-caso-mensajes");
    const documentosEl = document.getElementById("tour-caso-documentos");

    const steps = [
      tituloEl ? {
        element: tituloEl,
        popover: {
          title: "Resumen del caso",
          description: "Aquí verás el nombre del caso y su asunto.",
          side: "top",
          align: "start",
        },
      } : null,
      descripcionEl ? {
        element: descripcionEl,
        popover: {
          title: "Descripción del caso",
          description: "Detalles y contexto que añadió el profesional o tú.",
          side: "top",
          align: "start",
        },
      } : null,
      mensajesEl ? {
        element: mensajesEl,
        popover: {
          title: "Mensajes",
          description: "Comunicación directa con tu profesional. Envía y revisa mensajes aquí.",
          side: "top",
          align: "start",
        },
      } : null,
      documentosEl ? {
        element: documentosEl,
        popover: {
          title: "Documentos",
          description: "Consulta y sube documentos asociados a tu caso.",
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
    <div className={className ?? ""}>
      <Button variant="secondary" size="sm" onClick={startTour} aria-label="Iniciar recorrido">
        Ver recorrido
      </Button>
    </div>
  );
}