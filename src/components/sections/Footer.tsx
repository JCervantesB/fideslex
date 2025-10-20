import { Facebook, Instagram, Linkedin, Mail, Phone } from "lucide-react";
import Image from "next/image";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 gradient-accent rounded-lg flex items-center justify-center">
                <Image src="/logo.png" alt="Logo" width={24} height={24} className="object-contain" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Asesoría Jurídica</h3>
                <p className="text-sm text-background/70">Servicios Jurídicos Especializados</p>
              </div>
            </div>
            <p className="text-background/70 text-base mb-4">
              Brindando soluciones legales accesibles y profesionales para todos.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-background/10 hover:bg-background/20 rounded-lg flex items-center justify-center transition-base">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/fides.lex/?igsh=dmQ3bHYzMGt6eDBq" className="w-10 h-10 bg-background/10 hover:bg-background/20 rounded-lg flex items-center justify-center transition-base">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-background/10 hover:bg-background/20 rounded-lg flex items-center justify-center transition-base">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-3">
              <li>
                <a href="#servicios" className="text-background/70 hover:text-background transition-base text-base">
                  Nuestros Servicios
                </a>
              </li>
              <li>
                <a href="#nosotros" className="text-background/70 hover:text-background transition-base text-base">
                  Sobre Nosotros
                </a>
              </li>
              <li>
                <a href="#contacto" className="text-background/70 hover:text-background transition-base text-base">
                  Contacto
                </a>
              </li>
              <li>
                <a href="#" className="text-background/70 hover:text-background transition-base text-base">
                  Política de Privacidad
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-background/70 text-base">+52 1 646 259 4685</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-background/70 text-base break-words">contacto@fideslex.site</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 pt-8 text-center">
          <p className="text-background/70 text-base">© {currentYear} Fídes Lex. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};