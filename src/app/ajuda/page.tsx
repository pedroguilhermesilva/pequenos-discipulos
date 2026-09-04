import Link from 'next/link';
import { AppShell } from '@/components/AppShell';

export const metadata = {
  title: 'Ajuda — Pequenos Discípulos',
  description: 'Perguntas frequentes e orientações para usar o Pequenos Discípulos.',
};

const faqItems = [
  {
    question: 'Como crio uma nova história?',
    answer:
      'Na página inicial ou no menu lateral, toque em «Nova história». Escolha o tipo de conteúdo, a passagem bíblica e deixe a magia acontecer.',
  },
  {
    question: 'Posso ter mais do que um perfil de criança?',
    answer:
      'Sim. Em «Perfis» pode adicionar vários pequenos e alternar entre eles para personalizar histórias para cada um.',
  },
  {
    question: 'Onde vejo os meus limites de uso?',
    answer:
      'Em Configurações, na secção «Limites de uso», encontra a contagem mensal de histórias, áudios e vídeos da sua conta.',
  },
  {
    question: 'Como guardo uma história nos favoritos?',
    answer:
      'Ao ler uma história, use o ícone de coração para guardá-la. Depois aceda a «Favoritos» no menu lateral.',
  },
];

export default function AjudaPage() {
  return (
    <AppShell>
      <div className="space-y-8 animate-fade-in">
        <header className="space-y-2">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-tinta">Ajuda</h1>
          <p className="text-oliva text-base md:text-lg max-w-2xl">
            Respostas rápidas às dúvidas mais comuns. Precisa de mais apoio? Visite as{' '}
            <Link
              href="/configuracoes"
              className="font-semibold text-vida hover:text-vida-dark underline underline-offset-2"
            >
              configurações
            </Link>{' '}
            da sua conta.
          </p>
        </header>

        <div className="space-y-4">
          {faqItems.map((item) => (
            <details
              key={item.question}
              className="group rounded-livro border border-borda bg-white shadow-livro overflow-hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-display font-bold text-tinta marker:content-none hover:bg-pergaminho/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja focus-visible:ring-inset">
                {item.question}
                <span className="material-symbols-outlined text-oliva transition-transform group-open:rotate-180">
                  expand_more
                </span>
              </summary>
              <div className="border-t border-borda px-5 py-4 text-sm text-oliva leading-relaxed">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
