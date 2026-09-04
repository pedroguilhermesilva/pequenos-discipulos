import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-pergaminho textura-pergaminho flex flex-col">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-borda shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 md:px-10 h-16">
          <Logo size="md" />
          <Link
            href="/login"
            className="text-sm font-semibold text-oliva hover:text-laranja transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja rounded"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 px-6 md:px-10 py-12 max-w-6xl mx-auto w-full">
        <div className="flex-1 text-center lg:text-left animate-fade-in">
          <p className="text-oliva text-sm font-semibold uppercase tracking-widest mb-4">
            Educação bíblica infantil
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-tinta leading-tight mb-6">
            Histórias bíblicas na{' '}
            <span className="text-laranja">idade certa</span>
          </h1>
          <p className="text-oliva text-lg md:text-xl leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0">
            Cada história é adaptada à fase do seu pequeno — com palavras que ele entende,
            ilustrações que encantam e momentos para ler juntos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link
              href="/onboarding/step-1"
              className="btn-primary px-8 py-4 text-lg"
            >
              Começar
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-laranja font-bold text-lg rounded-livro border-2 border-laranja hover:bg-laranja-suave transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja focus-visible:ring-offset-2"
            >
              Já tenho conta
            </Link>
          </div>
        </div>

        <div className="flex-1 w-full max-w-md lg:max-w-lg animate-slide-in-right">
          <div className="relative bg-white rounded-livro-xl shadow-livro-lg border border-borda p-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-ceu-claro rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative space-y-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-laranja text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_stories
                </span>
                <div>
                  <p className="font-display font-bold text-tinta text-lg">A Estrela de Mateus</p>
                  <p className="text-oliva text-sm">Adaptada para 1–2 anos</p>
                </div>
                <span className="ml-auto text-[10px] bg-laranja-suave text-laranja font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Kids
                </span>
              </div>
              <blockquote className="font-story text-2xl text-tinta leading-snug border-l-4 border-amber pl-4">
                Era uma vez, no céu muito azul, uma{' '}
                <span className="text-laranja font-bold">estrela</span> muito brilhante!
              </blockquote>
              <p className="text-oliva text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-ceu text-base">touch_app</span>
                Toque nas palavras para ouvir o som
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-oliva/70 text-sm">
        <p>© {new Date().getFullYear()} Pequenos Discípulos</p>
      </footer>
    </div>
  );
}
