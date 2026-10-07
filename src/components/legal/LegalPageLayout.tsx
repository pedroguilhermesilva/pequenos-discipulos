import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { LegalFooterLinks } from '@/components/legal/LegalFooterLinks';
import { LEGAL_DRAFT_NOTICE, PRIVACY_CONTACT_EMAIL } from '@/lib/privacy/constants';

interface LegalPageLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ title, subtitle, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-pergaminho textura-pergaminho flex flex-col">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-borda">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-vida rounded"
          >
            <Logo size="md" />
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold text-oliva hover:text-vida transition-colors"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 py-10 md:py-14">
        <article className="max-w-3xl mx-auto animate-fade-in">
          <div
            role="note"
            className="mb-8 rounded-livro border border-dourado/40 bg-dourado/10 px-4 py-3 text-sm text-tinta"
          >
            <span className="font-semibold">Aviso:</span> {LEGAL_DRAFT_NOTICE}
          </div>

          <header className="mb-10 border-b border-borda pb-8">
            <p className="text-oliva text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              Documento legal
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-tinta leading-tight mb-3">
              {title}
            </h1>
            <p className="text-oliva text-lg leading-relaxed">{subtitle}</p>
          </header>

          <div className="legal-prose space-y-8 text-tinta leading-relaxed">{children}</div>

          <aside className="mt-12 pt-8 border-t border-borda">
            <h2 className="font-display font-bold text-lg text-tinta mb-2">Contato</h2>
            <p className="text-oliva text-sm">
              Para exercer seus direitos ou tirar dúvidas sobre privacidade, escreva para{' '}
              <a
                href={`mailto:${PRIVACY_CONTACT_EMAIL}`}
                className="text-vida font-semibold hover:underline"
              >
                {PRIVACY_CONTACT_EMAIL}
              </a>
              .
            </p>
          </aside>
        </article>
      </main>

      <footer className="py-8 px-6 border-t border-borda bg-white/50">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-3 text-oliva/70 text-sm">
          <LegalFooterLinks />
          <p>© {new Date().getFullYear()} Pequenos Discípulos</p>
        </div>
      </footer>
    </div>
  );
}
