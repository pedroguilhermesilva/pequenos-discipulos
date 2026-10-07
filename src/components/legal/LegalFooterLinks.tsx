import Link from 'next/link';

export function LegalFooterLinks({ className = '' }: { className?: string }) {
  return (
    <nav
      className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm ${className}`}
      aria-label="Documentos legais"
    >
      <Link
        href="/privacidade"
        className="text-oliva hover:text-vida transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vida rounded"
      >
        Política de Privacidade
      </Link>
      <span className="text-borda hidden sm:inline" aria-hidden>
        ·
      </span>
      <Link
        href="/termos"
        className="text-oliva hover:text-vida transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vida rounded"
      >
        Termos de Uso
      </Link>
    </nav>
  );
}
