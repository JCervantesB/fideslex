"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const firstName = String(formData.get("firstName") || "");
    const lastName = String(formData.get("lastName") || "");
    const phone = String(formData.get("phone") || "");
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    if (!firstName || !lastName || !phone || !email || !password) {
      setError("Todos los campos son obligatorios.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await signUp.email({
        email,
        password,
        name: firstName + (lastName ? ` ${lastName}` : ""),
        callbackURL: "/dashboard/cliente",
      });

      if (error) throw new Error(error.message || "Error en registro");
      if (!data?.user?.id) throw new Error("Registro sin usuario válido");

      await fetch("/api/profile/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.user.id,
          firstName,
          lastName,
          phone,
          role: "cliente",
        }),
      });

      // Enviar email de bienvenida (no bloquea el registro si falla)
      try {
        await fetch("/api/email/welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email,
            name: firstName + (lastName ? ` ${lastName}` : ""),
          }),
        });
      } catch (e) {
        // Ignorar errores de notificación para no afectar UX
        console.warn("Fallo enviando email de bienvenida", e);
      }

      router.push("/dashboard/cliente");
    } catch (err: any) {
      setError(err?.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    // Contenedor responsivo y centrado verticalmente; ancho crece en ≥md/≥lg
    <div className="container mx-auto px-4 min-h-[calc(100vh-80px)] py-12 flex items-center">
      <div className="mx-auto w-full max-w-lg md:max-w-xl lg:max-w-2xl">
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Crear cuenta</CardTitle>
            <CardDescription>Regístrate para gestionar tus servicios</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="firstName">Nombre</Label>
                <Input id="firstName" name="firstName" placeholder="Tu nombre" required />
              </div>
              <div>
                <Label htmlFor="lastName">Apellidos</Label>
                <Input id="lastName" name="lastName" placeholder="Tus apellidos" required />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" name="phone" placeholder="Tu número" required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="tucorreo@dominio.com" required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder="••••••••" required />
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Creando cuenta..." : "Registrarme"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <div className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Button asChild variant="link" className="p-0 h-auto">
                <Link href="/sign-in">Iniciar sesión</Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}