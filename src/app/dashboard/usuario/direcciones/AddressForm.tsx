"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, X } from "lucide-react";
import { toast } from "sonner";

interface Address {
  id: number;
  nombre: string;
  direccion: string;
  createdAt: string;
  updatedAt: string;
}

interface AddressFormProps {
  address?: Address | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddressForm({ address, onSuccess, onCancel }: AddressFormProps) {
  const [formData, setFormData] = useState({
    nombre: address?.nombre || "",
    direccion: address?.direccion || "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const isEditing = !!address;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (!formData.direccion.trim()) {
      newErrors.direccion = "La dirección es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const url = isEditing ? `/api/direcciones/${address.id}` : "/api/direcciones";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          direccion: formData.direccion.trim(),
        }),
      });

      const data = await response.json();

      if (data.ok) {
        toast.success(
          isEditing 
            ? "Dirección actualizada correctamente" 
            : "Dirección agregada correctamente"
        );
        onSuccess();
      } else {
        toast.error(data.error || "Error al guardar la dirección");
      }
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Error al guardar la dirección");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div>
          <h2 className="text-lg font-medium">
            {isEditing ? "Editar Dirección" : "Agregar Nueva Dirección"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEditing 
              ? "Modifica los datos de la dirección" 
              : "Completa los datos para agregar una nueva dirección"
            }
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isEditing ? "Datos de la Dirección" : "Nueva Dirección"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">
                Nombre de la Dirección <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nombre"
                type="text"
                placeholder="Ej: Casa, Oficina, Consultorio..."
                value={formData.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                className={errors.nombre ? "border-destructive" : ""}
              />
              {errors.nombre && (
                <p className="text-sm text-destructive">{errors.nombre}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">
                Dirección Completa <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="direccion"
                placeholder="Ingresa la dirección completa incluyendo calle, número, colonia, ciudad..."
                value={formData.direccion}
                onChange={(e) => handleInputChange("direccion", e.target.value)}
                className={errors.direccion ? "border-destructive" : ""}
                rows={3}
              />
              {errors.direccion && (
                <p className="text-sm text-destructive">{errors.direccion}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {loading 
                  ? "Guardando..." 
                  : isEditing 
                    ? "Actualizar Dirección" 
                    : "Agregar Dirección"
                }
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}