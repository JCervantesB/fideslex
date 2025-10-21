import type { ReactNode } from "react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import MobileDashboardNavbar from "@/components/dashboard/MobileDashboardNavbar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Mostrar navbar móvil en <lg y navbar de escritorio en ≥lg (forzando prioridad con !important) */}
      <div className="block lg:!hidden">
        <MobileDashboardNavbar />
      </div>
      <div className="hidden lg:!block">
        <DashboardNavbar />
      </div>

      {/* Indicador de breakpoint para diagnóstico (temporal) */}
      <div className="fixed bottom-2 right-2 z-50 pointer-events-none">
        <div className="rounded bg-black/70 text-white text-xs px-2 py-1">
          <span className="sm:hidden">xs</span>
          <span className="hidden sm:block md:hidden">sm</span>
          <span className="hidden md:block lg:hidden">md</span>
          <span className="hidden lg:block xl:hidden">lg</span>
          <span className="hidden xl:block">xl</span>
        </div>
      </div>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {children}
      </main>
    </>
  );
}