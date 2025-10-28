import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";
import { Services } from "@/components/sections/Services";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans mt-8">
      <Header />
      <main className="flex-1">
        <Hero />
        <section id="servicios" className="mt-8">
          <Services />
        </section>
        <section id="nosotros" className="mt-8">
          <About />
        </section>
        <section id="contacto" className="mt-8">
          <Contact />
        </section>
        {/* Logos grid before footer */}
        <section aria-label="Instituciones y aliados" className="mt-8">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 items-center">
              <div className="flex flex-col items-center gap-2 rounded-xl">
                <img
                  src="/banner1.webp"
                  alt="Banner 1"
                  className="mx-auto h-16 md:h-20 w-auto object-contain opacity-80 hover:opacity-100 transition"
                />
                <a href="https://www.diputados.gob.mx/LeyesBiblio/pdf/LFDA.pdf" className="text-sm text-slate-700 hover:text-slate-900 hover:underline">Leer más</a>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl">
                <img
                  src="/banner2.webp"
                  alt="Banner 2"
                  className="mx-auto h-16 md:h-20 w-auto object-contain opacity-80 hover:opacity-100 transition"
                />
                <a href="https://www.un.org/es/about-us/universal-declaration-of-human-rights" className="text-sm text-slate-700 hover:text-slate-900 hover:underline">Leer más</a>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl">
                <img
                  src="/banner3.webp"
                  alt="Banner 3"
                  className="mx-auto h-16 md:h-20 w-auto object-contain opacity-80 hover:opacity-100 transition"
                />
                <a href="https://www.un.org/es/" className="text-sm text-slate-700 hover:text-slate-900 hover:underline">Leer más</a>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl">
                <img
                  src="/banner4.webp"
                  alt="Banner 4"
                  className="mx-auto h-16 md:h-20 w-auto object-contain opacity-80 hover:opacity-100 transition"
                />
                <a href="https://www.scjn.gob.mx/" className="text-sm text-slate-700 hover:text-slate-900 hover:underline">Leer más</a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
