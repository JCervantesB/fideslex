import type { ReactNode } from "react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </>
  );
}