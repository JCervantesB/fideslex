"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Pencil, Trash2, Plus, CircleX } from "lucide-react";
import { AddressForm } from "./AddressForm";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Address {
  id: number;
  nombre: string;
  direccion: string;
  createdAt: string;
  updatedAt: string;
}

export function AddressDirectory() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const fetchAddresses = async () => {
    try {
      const response = await fetch("/api/direcciones");
      const data = await response.json();
      
      if (data.ok) {
        setAddresses(data.items);
      } else {
        toast.error("Error al cargar las direcciones");
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Error al cargar las direcciones");
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleAddAddress = () => {
    setSelectedAddress(null);
    setIsModalOpen(true);
  };

  const handleEditAddress = (address: Address) => {
    setSelectedAddress(address);
    setIsModalOpen(true);
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      const response = await fetch(`/api/direcciones/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.ok) {
        toast.success("Dirección eliminada correctamente");
        fetchAddresses();
      } else {
        toast.error("Error al eliminar la dirección");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Error al eliminar la dirección");
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedAddress(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-medium">Directorio de Direcciones</h2>
          <p className="text-sm text-muted-foreground">
            {addresses.length} {addresses.length === 1 ? "dirección registrada" : "direcciones registradas"}
          </p>
        </div>
      </div>

      {addresses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay direcciones registradas</h3>
            <p className="text-muted-foreground text-center">
              Agrega tu primera dirección usando el botón «Nueva dirección».
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
                      Registrada el {new Date(address.createdAt).toLocaleDateString()}
                    </Badge>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditAddress(address)}>
                        <Pencil className="h-4 w-4 mr-2" /> Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteAddress(address.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleAddAddress}>
          <Plus className="h-4 w-4 mr-2" /> Nueva dirección
        </Button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-lg">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="text-lg font-medium">
                {selectedAddress ? "Editar dirección" : "Nueva dirección"}
              </h3>
              <button
                onClick={handleModalClose}
                className="rounded-full hover:bg-muted p-2"
                aria-label="Cerrar"
              >
                <CircleX className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <AddressForm
                address={selectedAddress}
                onSuccess={() => {
                  handleModalClose();
                  fetchAddresses();
                }}
                onCancel={handleModalClose}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}