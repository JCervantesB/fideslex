"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, Clock, NotebookPen } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    date: "",
    time: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const { name, email, phone, service, date, time, message } = formData;
    const [hh, mm] = time.split(":");
    const startMin = Number(hh) * 60 + Number(mm);
    if (!name || !email || !phone || !service || !date || !time || Number.isNaN(startMin)) {
      toast({ title: "Campos requeridos", description: "Completa todos los campos obligatorios.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/solicitudes-citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: name,
          clientEmail: email,
          clientPhone: phone,
          serviceName: service,
          date,
          startMin,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Error al enviar la solicitud");
      }
      toast({ title: "¡Solicitud enviada!", description: "Nos pondremos en contacto contigo pronto." });
      setFormData({ name: "", email: "", phone: "", service: "", date: "", time: "", message: "" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contacto" className="py-2 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-6 py-2 bg-primary/10 rounded-full">
            <p className="text-primary font-semibold text-lg">Contáctanos</p>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Agenda tu Consulta</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Estamos listos para ayudarte. Completa el formulario y nos comunicaremos contigo lo antes posible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Contact Form */}
          <Card className="lg:col-span-2 gradient-card border-border shadow-elegant">
            <CardHeader>
              <CardTitle className="text-2xl">Formulario de Contacto</CardTitle>
              <CardDescription className="text-base">Campos requeridos: nombre, email, teléfono, servicio, fecha y hora.</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="contact-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base">Nombre Completo</Label>
                    <Input
                      id="name"
                      placeholder="Juan Pérez García"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-12 text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-base">Teléfono</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="55 1234 5678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service" className="text-base">Servicio de Interés</Label>
                    <Select
                      value={formData.service}
                      onValueChange={(value) => setFormData({ ...formData, service: value })}
                      required
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Selecciona un servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Registro de Marca">Registro de Marca</SelectItem>
                        <SelectItem value="Actas en Línea">Actas en Línea</SelectItem>
                        <SelectItem value="Trámite de Pasaporte">Trámite de Pasaporte</SelectItem>
                        <SelectItem value="Licencia de Conducir">Licencia de Conducir</SelectItem>
                        <SelectItem value="Inscripción RFC">Inscripción RFC</SelectItem>
                        <SelectItem value="Otro">Otro Servicio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-base">Fecha deseada</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-base">Hora deseada</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                      className="h-12 text-base"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-base">Mensaje</Label>
                  <Textarea
                    id="message"
                    placeholder="Cuéntanos cómo podemos ayudarte..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="min-h-32 text-base resize-none"
                  />
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar Solicitud"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-6">
            <Card className="gradient-card border-border hover:shadow-xl transition-smooth">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 gradient-hero rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Teléfono</h3>
                    <p className="text-muted-foreground text-base">+52 1 646 259 4685</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 gradient-hero rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Email</h3>
                    <p className="text-muted-foreground text-base break-words">contacto@fideslex.site</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 gradient-hero rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Ubicación</h3>
                    <p className="text-muted-foreground text-base">
                      100% Online
                      <br />
                      Servicios en Ensenada, Baja California
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 gradient-hero rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Horarios de Atención</h3>
                    <p className="text-muted-foreground text-base">
                      Lunes a Viernes: 9:00 - 18:00
                    </p>
                  </div>
                </div>
                
              </CardContent>
            </Card>

            <Card className="gradient-hero border-none">
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-bold text-white mb-2">Consulta Gratuita</h3>
                <p className="text-base text-primary-foreground/90">Primera asesoría sin costo para conocer tu caso</p>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </section>
  );
};