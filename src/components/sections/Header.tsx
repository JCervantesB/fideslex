"use client";

import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useRouter } from "next/navigation";
import Logo from "./Logo";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const router = useRouter();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false); // Cierra menú móvil al navegar
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/profile", { credentials: "include", cache: "no-store" });
        const data = await res.json();
        if (active) setHasSession(Boolean(data?.ok && data.item));
      } catch {
        if (active) setHasSession(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  function handleAccessClick() {
    if (hasSession === true) {
      router.push("/dashboard");
    } else if (hasSession === false) {
      router.push("/sign-in");
    } else {
      (async () => {
        try {
          const res = await fetch("/api/profile", { credentials: "include", cache: "no-store" });
          const data = await res.json();
          router.push(Boolean(data?.ok && data.item) ? "/dashboard" : "/sign-in");
        } catch {
          router.push("/sign-in");
        }
      })();
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">

          {/* Logo y marca */}
          <div className="flex items-center gap-3 ">
            <div className="w-[100px] h-[70px] rounded-lg flex items-center justify-center">
              <Logo className="w-[100px] h-[70px] text-primary dark:text-foreground" aria-label="FidesLex" />
            </div>
            <div>
              <h1 className="font-bold text-2xl text-primary dark:text-foreground hover:text-secondary transition-colors">Fídes Lex Asesoría</h1>
            </div>
          </div>

          {/* Navegación escritorio */}
          <nav className="hidden md:!flex items-center gap-6">
            <button onClick={() => scrollToSection("servicios")} className="text-base text-foreground hover:text-secondary transition-base font-medium">
              Servicios
            </button>
            <button onClick={() => scrollToSection("nosotros")} className="text-base text-foreground hover:text-secondary transition-base font-medium">
              Nosotros
            </button>
            <button onClick={() => scrollToSection("contacto")} className="text-base text-foreground hover:text-secondary transition-base font-medium">
              Contacto
            </button>
            <Button id="btn-agendar-cita" variant="secondary" size="default" onClick={() => scrollToSection("contacto")}>
              Agendar Cita
            </Button>
            <Button id="btn-acceder" size="default" onClick={handleAccessClick}>
              Acceder
            </Button>
            <ThemeToggle />
          </nav>

          {/* Botón menú móvil */}
          <div className="flex md:!hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-muted rounded-lg transition-base"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Navegación móvil */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 flex flex-col gap-3 border-t pt-4">
            <button onClick={() => scrollToSection("servicios")} className="text-lg text-foreground hover:text-primary transition-base font-medium text-left py-2">
              Servicios
            </button>
            <button onClick={() => scrollToSection("nosotros")} className="text-lg text-foreground hover:text-primary transition-base font-medium text-left py-2">
              Nosotros
            </button>
            <button onClick={() => scrollToSection("contacto")} className="text-lg text-foreground hover:text-primary transition-base font-medium text-left py-2">
              Contacto
            </button>
            <Button id="btn-agendar-cita-mobile" variant="secondary" size="lg" className="w-full" onClick={() => scrollToSection("contacto")}>
              Agendar Cita
            </Button>
            <Button id="btn-acceder-mobile" size="lg" className="w-full" onClick={handleAccessClick}>
              Acceder
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
};
