import Link from 'next/link';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';
import { LegalSection } from '@/components/legal/LegalSection';

export const metadata = {
  title: 'Termos de Uso — Pequenos Discípulos',
  description: 'Regras de uso do Pequenos Discípulos para pais e responsáveis.',
};

export default function TermosPage() {
  return (
    <LegalPageLayout
      title="Termos de Uso"
      subtitle="Leia com calma antes de criar a conta. Ao usar o Pequenos Discípulos, você concorda com estes termos em nome da sua família."
    >
      <LegalSection title="Quem pode usar">
        <p>
          O Pequenos Discípulos é destinado a <strong>pais ou responsáveis legais</strong> que
          criam a conta e gerenciam os perfis das crianças. Ao se cadastrar, você declara ser
          maior de idade e ter autoridade para consentir em nome dos menores sob sua
          responsabilidade.
        </p>
      </LegalSection>

      <LegalSection title="O que o serviço oferece">
        <p>
          Oferecemos histórias bíblicas adaptadas por faixa etária, com texto, áudio interativo e
          recursos de leitura em família. Parte do conteúdo é gerada por inteligência artificial e
          revisada pedagogicamente; pode conter imprecisões — use o discernimento parental.
        </p>
      </LegalSection>

      <LegalSection title="Sua responsabilidade">
        <ul className="list-disc pl-5 space-y-2">
          <li>Manter a senha em segurança e não compartilhar o acesso com terceiros.</li>
          <li>
            Usar um <strong>apelido</strong> no perfil da criança, evitando dados desnecessários.
          </li>
          <li>Supervisionar o uso do app pelos menores.</li>
          <li>Não usar o serviço para fins ilegais ou abusivos.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Conteúdo gerado e compartilhado">
        <p>
          Histórias que você gera ficam vinculadas à sua conta. Se aprovar ou compartilhar uma
          adaptação com a comunidade, ela pode ser reutilizada por outras famílias. Ao excluir sua
          conta, suas adaptações compartilhadas permanecem disponíveis de forma anônima (sem
          identificar você como autor).
        </p>
      </LegalSection>

      <LegalSection title="Planos e limites">
        <p>
          O plano gratuito tem limites mensais de geração. Planos pagos, quando disponíveis,
          ampliam esses limites conforme descrito na área de Configurações.
        </p>
      </LegalSection>

      <LegalSection title="Privacidade">
        <p>
          O tratamento de dados pessoais está descrito na{' '}
          <Link href="/privacidade" className="text-vida font-semibold hover:underline">
            Política de Privacidade
          </Link>
          . Ao aceitar estes termos, você também concorda com essa política.
        </p>
      </LegalSection>

      <LegalSection title="Encerramento da conta">
        <p>
          Você pode excluir sua conta a qualquer momento em Configurações. Podemos suspender ou
          encerrar contas que violem estes termos ou a legislação aplicável.
        </p>
      </LegalSection>

      <LegalSection title="Alterações">
        <p>
          Podemos atualizar estes termos. Quando houver mudanças relevantes, pediremos novo
          consentimento antes de continuar usando o serviço.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
