"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2 } from "lucide-react";
import { toast } from "sonner";

interface Address {
  id: number;
  nombre: string;
  direccion: string;
  createdAt: string;
}

export function ClientAddressView() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAddresses = async () => {
    try {
      const response = await fetch("/api/direcciones/cliente");
      const data = await response.json();
      
      if (data.ok) {
        setAddresses(data.items);
      } else {
        toast.error("Error al cargar las direcciones");
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Error al cargar las direcciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Cargando direcciones...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-medium">Direcciones Disponibles</h2>
          <p className="text-sm text-muted-foreground">
            {addresses.length} {addresses.length === 1 ? "dirección disponible" : "direcciones disponibles"}
          </p>
        </div>
      </div>

      {addresses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay direcciones disponibles</h3>
            <p className="text-muted-foreground text-center">
              Actualmente no hay direcciones registradas en el sistema.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {addresses.map((address) => (
            <Card key={address.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {address.nombre}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {address.direccion}
                  </p>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-xs">
                      Disponible desde {new Date(address.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
          <div>
            <h4 className="text-sm font-medium mb-1">Información</h4>
            <p className="text-sm text-muted-foreground">
              Estas direcciones están disponibles para la programación de citas y servicios. 
              Si necesitas agregar una nueva dirección o modificar alguna existente, 
              contacta con el administrador del sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}