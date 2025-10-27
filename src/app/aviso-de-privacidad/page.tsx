import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Aviso de Privacidad | Fides Lex",
  description: "Conoce cómo protegemos tus datos personales y tus derechos.",
};

export default function AvisoDePrivacidadPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <Button asChild variant="link" className="p-0 h-auto">
            <Link href="/">← Volver al inicio</Link>
          </Button>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Aviso de Privacidad</h1>
        <p className="text-base md:text-lg text-muted-foreground mb-8">
          En Fides Lex respetamos y protegemos tus datos personales. Este aviso explica
          qué información recopilamos, con qué fines la utilizamos y cómo puedes ejercer tus derechos.
        </p>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold text-foreground">1. Responsable del tratamiento</h2>
          <p className="text-muted-foreground">
            Fides Lex es responsable del uso y protección de tus datos personales y, al respecto,
            te informamos lo siguiente.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold text-foreground">2. Datos que recopilamos</h2>
          <p className="text-muted-foreground">Podemos recabar los siguientes datos, según el servicio:</p>
          <ul className="list-disc pl-6 text-muted-foreground">
            <li>Identificación: nombre, apellidos.</li>
            <li>Contacto: correo electrónico, teléfono.</li>
            <li>Información de servicio: solicitudes, casos y preferencias.</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold text-foreground">3. Finalidades del tratamiento</h2>
          <p className="text-muted-foreground">Usamos tus datos para:</p>
          <ul className="list-disc pl-6 text-muted-foreground">
            <li>Proveer los servicios solicitados y dar seguimiento a tus casos.</li>
            <li>Gestionar citas, notificaciones y comunicación contigo.</li>
            <li>Mejorar la experiencia y el funcionamiento de nuestra plataforma.</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold text-foreground">4. Transferencias y terceros</h2>
          <p className="text-muted-foreground">
            No compartimos tus datos con terceros, salvo por obligación legal o para cumplir con los servicios
            contratados (por ejemplo, proveedores tecnológicos), siempre bajo medidas de seguridad adecuadas.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold text-foreground">5. Conservación y seguridad</h2>
          <p className="text-muted-foreground">
            Conservamos tus datos por el tiempo necesario para cumplir las finalidades descritas y aplicamos
            medidas técnicas y organizativas para protegerlos contra acceso, pérdida o uso no autorizado.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold text-foreground">6. Derechos ARCO</h2>
          <p className="text-muted-foreground">
            Puedes ejercer tus derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO), así como
            revocar tu consentimiento, mediante el formulario en la sección "Contacto" del sitio.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold text-foreground">7. Cookies y tecnologías similares</h2>
          <p className="text-muted-foreground">
            Este sitio puede utilizar cookies para mejorar tu experiencia. Puedes configurar tu navegador
            para rechazarlas; algunas funciones podrían verse afectadas.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">8. Actualizaciones del aviso</h2>
          <p className="text-muted-foreground">
            Podremos actualizar este aviso para reflejar cambios legales o de nuestros servicios. La versión vigente
            siempre estará disponible en esta página.
          </p>
        </section>
      </div>
    </div>
  );
}