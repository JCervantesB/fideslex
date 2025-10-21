import { Target, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const About = () => {
  return (
    <section id="nosotros" className="py-2">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-6 py-2 bg-primary/10 rounded-full">
            <p className="text-primary font-semibold text-lg">
              Quiénes Somos
            </p>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Compromiso y Profesionalismo
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Mission */}
          <Card className="gradient-card border-2 border-primary/20 hover:shadow-xl transition-smooth">
            <CardContent className="p-8">
              <div className="w-16 h-16 gradient-hero rounded-xl flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-3xl font-bold mb-4 text-primary">Misión</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Brindar asesoría de calidad, comprometiéndonos a resolver los 
                conflictos de nuestros clientes efectivamente y buscando cumplir 
                sus necesidades con profesionalismo y dedicación.
              </p>
            </CardContent>
          </Card>

          {/* Vision */}
          <Card className="gradient-card border-2 border-secondary/20 hover:shadow-xl transition-smooth">
            <CardContent className="p-8">
              <div className="w-16 h-16 gradient-accent rounded-xl flex items-center justify-center mb-6">
                <Eye className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="text-3xl font-bold mb-4 text-secondary">Visión</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Ser una firma legal reconocida por nuestro profesionalismo basado 
                en los valores que nos representan y la atención satisfactoria 
                que brindamos a nuestros clientes.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Value Proposition */}
        <div className="bg-primary/5 rounded-2xl p-8 md:p-12 border border-primary/10">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-20 h-20 gradient-hero rounded-2xl flex items-center justify-center flex-shrink-0">
              <img src="/asa.jpeg" alt="Aliado ASA" className="w-10 h-10 rounded-md object-cover" /> 
            </div>
            <div className="flex-1">
              <h3 className="text-3xl font-bold mb-4">
                Respaldo Legal Especializado
              </h3>
              <p className="text-xl text-muted-foreground leading-relaxed mb-6">
                Nuestra firma está aliada a un despacho legal confiable, lo que 
                garantiza un respaldo jurídico sólido en cada servicio que ofrecemos.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="px-6 py-3 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="text-accent font-semibold text-lg">✓ Soluciones Integrales</p>
                </div>
                <div className="px-6 py-3 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="text-accent font-semibold text-lg">✓ Seguridad Garantizada</p>
                </div>
                <div className="px-6 py-3 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="text-accent font-semibold text-lg">✓ Equipo Certificado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};