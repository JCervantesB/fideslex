"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Phone } from "lucide-react";
import Image from "next/image";
import HomeTour from "@/components/tours/HomeTour";

export const Hero = () => {
  const scrollToContact = () => {
    const element = document.getElementById("contacto");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center pt-20">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/hero-legal.jpg" 
          alt="Asesoría legal profesional"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/60" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        {/* HomeTour colocado junto al badge */}
        <div className="max-w-3xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="inline-block px-6 py-2 gradient-accent rounded-full">
              <p className="text-secondary-foreground font-semibold text-lg">
                Asesoría Legal 100% Online
              </p>
            </div>
            <HomeTour className="inline-block" />
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-gradient">Soluciones Legales</span>
            <br />
            <span className="text-foreground">Accesibles para Todos</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-2xl">
            Brindamos asesoría jurídica especializada con un enfoque amigable 
            y accesible. 
            Servicios profesionales desde la comodidad de tu hogar.
          </p>

          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-4 w-full">
            <Button 
              variant="hero" 
              size="xl"
              onClick={scrollToContact}
            >
              Agendar Consulta Gratuita
              <ArrowRight className="w-5 h-5" />
            </Button>
            
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 pt-12 border-t border-border/50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-3xl font-bold text-primary mb-1">100%</p>
                <p className="text-muted-foreground text-lg">Online</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary mb-1">24/7</p>
                <p className="text-muted-foreground text-lg">Disponibilidad</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};