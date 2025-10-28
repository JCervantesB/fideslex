import { Facebook, Instagram, Linkedin, Mail, Phone } from "lucide-react";
import Logo from "./Logo";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#182335] text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-[100px] h-[70px] rounded-lg flex items-center justify-center">
                <Logo className="w-[100px] h-[70px] !text-white" aria-label="FidesLex" />
              </div>
              <div>
                <h3 className="text-xl font-bold !text-white">Fídes Lex Asesoría</h3>
              </div>
            </div>
            <p className="text-white/80 text-base mb-4">
              Brindando soluciones en tramites, accesibles para todos.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-base text-white">
                <Facebook className="w-5 h-5 text-white" />
              </a>
              <a href="https://www.instagram.com/fides.lex/?igsh=dmQ3bHYzMGt6eDBq" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-base text-white">
                <Instagram className="w-5 h-5 text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-base text-white">
                <Linkedin className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4 !text-white">Enlaces Rápidos</h3>
            <ul className="space-y-3">
              <li>
                <a href="#servicios" className="!text-white/80 hover:!text-white transition-base text-base">
                  Nuestros Servicios
                </a>
              </li>
              <li>
                <a href="#nosotros" className="!text-white/80 hover:!text-white transition-base text-base">
                  Sobre Nosotros
                </a>
              </li>
              <li>
                <a href="#contacto" className="!text-white/80 hover:!text-white transition-base text-base">
                  Contacto
                </a>
              </li>
              <li>
                <a href="/aviso-de-privacidad" className="!text-white/80 hover:!text-white transition-base text-base">
                  Política de Privacidad
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-4 !text-white">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 mt-1 flex-shrink-0 text-white" />
                <div>
                  <p className="text-white/80 text-base">+52 1 646 259 4685</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 mt-1 flex-shrink-0 text-white" />
                <div>
                  <p className="text-white/80 text-base break-words">contacto@fideslex.site</p>
                </div>
              </li>
              <div>
                <p className="text-white/70 text-sm">
                  © {currentYear} Fideslex. Todos los derechos reservados.
                </p>
              </div>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-white/80 text-base">
            © {currentYear} Fídes Lex Asesoría. Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  );
};
