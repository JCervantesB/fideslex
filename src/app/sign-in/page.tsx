"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function SignInPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      setError("Email y password son obligatorios.");
      setLoading(false);
      return;
    }

    try {
      const redirectTo = search.get("redirect") || "/dashboard";
      const { error } = await signIn.email({
        email,
        password,
        callbackURL: redirectTo,
      });

      if (error) throw new Error(error.message || "Error al iniciar sesión");
      router.push(redirectTo);
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
            <CardTitle>Iniciar sesión</CardTitle>
            <CardDescription>Accede a tu cuenta para gestionar tus servicios</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <div className="text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <Button asChild variant="link" className="p-0 h-auto">
                <Link href="/sign-up">Crear cuenta</Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}