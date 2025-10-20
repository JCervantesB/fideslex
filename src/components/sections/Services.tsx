import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ShieldCheck, Plane, CreditCard, FileCheck, UserCheck } from "lucide-react";

const services = [
  {
    icon: ShieldCheck,
    image: "/service-trademark.png",
    title: "Registro de Marca",
    description: "Protege tu marca/logo con nuestro servicio completo de registro",
    features: [
      "Búsqueda fonética previa",
      "Marcas, marcas mixtas y logotipos",
      "Aviso comercial",
      "Declaración de uso y renovaciones"
    ]
  },
  {
    icon: FileText,
    image: "/service-documents.png",
    title: "Actas en Línea",
    description: "Generación y corrección de actas oficiales de manera rápida y sencilla",
    features: [
      "Actas de nacimiento",
      "Actas de matrimonio",
      "Actas de defunción",
      "Corrección de cualquier error"
    ]
  },
  {
    icon: Plane,
    image: "/service-passport.png",
    title: "Trámites Oficiales",
    description: "Te ayudamos con todos tus trámites gubernamentales",
    features: [
      "Pasaporte mexicano",
      "Licencia de conducir",
      "Inscripción RFC",
      "Asesoría personalizada"
    ]
  },
  {
    icon: FileCheck,
    title: "Gestión Integral",
    description: "Seguimiento completo de tu caso desde inicio hasta resolución",
    features: [
      "Documentación organizada",
      "Actualizaciones constantes",
      "Acceso a tu expediente 24/7",
      "Notificaciones automáticas"
    ]
  },
  {
    icon: CreditCard,
    title: "Pagos Flexibles",
    description: "Opciones de pago accesibles para todos nuestros servicios",
    features: [
      "Planes de pago",
      "Consulta inicial gratuita",
      "Sin costos ocultos",
      "Presupuesto transparente"
    ]
  },
  {
    icon: UserCheck,
    title: "Atención Personalizada",
    description: "Asesoría dedicada con comunicación directa y clara",
    features: [
      "Videollamadas disponibles",
      "Lenguaje claro y sencillo",
      "Respaldo legal especializado",
      "Soporte continuo"
    ]
  }
];

export const Services = () => {
  return (
    <section id="servicios" className="py-2 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-6 py-2 bg-primary/10 rounded-full">
            <p className="text-primary font-semibold text-lg">
              Nuestros Servicios
            </p>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Respaldo Legal Especializado
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Nuestra firma está aliada a un despacho legal confiable, garantizando 
            soluciones integrales y seguras para nuestros clientes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className="gradient-card border-border hover:shadow-xl transition-smooth hover:-translate-y-1"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  {service.image ? (
                    <img 
                      src={service.image} 
                      alt={service.title}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 gradient-hero rounded-xl flex items-center justify-center">
                      <service.icon className="w-8 h-8 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <CardTitle className="text-2xl mb-2">{service.title}</CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                      <span className="text-base text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};