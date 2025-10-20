"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as AppToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

import { usePathname } from "next/navigation";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={!isDashboard}
      forcedTheme={isDashboard ? "light" : undefined}
    >
      <TooltipProvider>
        {children}
        <AppToaster />
        <SonnerToaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}