import { LegalPageLayout } from '@/components/legal/LegalPageLayout';
import { LegalSection } from '@/components/legal/LegalSection';

export const metadata = {
  title: 'Política de Privacidade — Pequenos Discípulos',
  description: 'Como tratamos os dados dos pais e das crianças no Pequenos Discípulos.',
};

export default function PrivacidadePage() {
  return (
    <LegalPageLayout
      title="Política de Privacidade"
      subtitle="Explicamos, em linguagem simples, quais dados coletamos sobre você e seu pequeno, para que servem e quais são seus direitos."
    >
      <LegalSection title="Quem somos">
        <p>
          O Pequenos Discípulos é um aplicativo de histórias bíblicas para crianças, operado por
          pais que criam a conta e gerenciam os perfis dos filhos. Esta política descreve como
          tratamos dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD).
        </p>
      </LegalSection>

      <LegalSection title="Quais dados coletamos">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Conta dos pais:</strong> e-mail, nome do responsável, senha (armazenada de
            forma segura) e, se você usar Google, nome e foto do perfil Google.
          </li>
          <li>
            <strong>Perfil da criança:</strong> apelido (recomendamos não usar o nome completo),
            faixa etária, cor do avatar e preferências de leitura (temas, estilo de linguagem,
            objetivo de uso).
          </li>
          <li>
            <strong>Histórico de leitura:</strong> quais histórias cada perfil de criança abriu
            (<code className="text-sm bg-pergaminho-escuro px-1 rounded">AdaptationView</code> e{' '}
            <code className="text-sm bg-pergaminho-escuro px-1 rounded">UserStory</code>), progresso
            de leitura e favoritos.
          </li>
          <li>
            <strong>Votos:</strong> avaliações que você dá às adaptações de histórias (com
            confirmação parental).
          </li>
          <li>
            <strong>Uso do serviço:</strong> quantas histórias foram geradas por mês, conforme o
            plano da conta.
          </li>
        </ul>
        <p>
          <strong>Não coletamos</strong> foto da criança, data de nascimento exata, documentos nem
          localização.
        </p>
      </LegalSection>

      <LegalSection title="Para que usamos esses dados">
        <ul className="list-disc pl-5 space-y-2">
          <li>Criar e manter sua conta e os perfis das crianças.</li>
          <li>Adaptar histórias à faixa etária e preferências de cada perfil.</li>
          <li>Mostrar favoritos, coleções e continuar de onde parou na leitura.</li>
          <li>Gerar novas histórias e melhorar as existentes (incluindo cache compartilhado).</li>
          <li>Cumprir limites do plano e proteger o serviço contra abuso.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Dados mínimos e privacidade da criança">
        <p>
          Pedimos apenas um <strong>apelido</strong> para identificar o perfil dentro do app — não
          o nome completo da criança. Esse apelido <strong>nunca é enviado</strong> para serviços
          de inteligência artificial (geração de texto) nem para síntese de voz (TTS). A geração de
          histórias usa somente a referência bíblica, a faixa etária e as preferências de estilo.
        </p>
      </LegalSection>

      <LegalSection title="Terceiros envolvidos">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>OpenAI</strong> (ou provedor LLM configurado): gera o texto das histórias a
            partir da referência bíblica e parâmetros pedagógicos.{' '}
            <strong>Não recebe dados identificáveis da criança.</strong>
          </li>
          <li>
            <strong>Provedor de voz</strong> (ElevenLabs): sintetiza áudio a partir do texto da
            história já gerada — sem nome ou dados pessoais da criança.
          </li>
          <li>
            <strong>Vercel</strong>: hospedagem do aplicativo e armazenamento privado de arquivos
            de áudio.
          </li>
          <li>
            <strong>Neon</strong>: banco de dados PostgreSQL onde ficam contas, perfis e histórico.
          </li>
          <li>
            <strong>Google</strong>: login opcional via OAuth (e-mail e nome do perfil Google).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Adaptações da comunidade">
        <p>
          Se você compartilhar uma história com a comunidade, ela pode continuar disponível para
          outras famílias mesmo após você excluir a conta. Nesse caso, removemos a ligação com sua
          identidade (o campo de autor fica anônimo), mas a adaptação permanece no catálogo
          compartilhado.
        </p>
      </LegalSection>

      <LegalSection title="Seus direitos (LGPD)">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Acesso:</strong> baixar uma cópia dos seus dados em JSON nas Configurações.
          </li>
          <li>
            <strong>Correção:</strong> editar nome, e-mail e preferências a qualquer momento.
          </li>
          <li>
            <strong>Exclusão:</strong> apagar a conta e todos os dados associados nas
            Configurações. Adaptações da comunidade que você criou serão anonimizadas, não
            apagadas.
          </li>
          <li>
            <strong>Revogação do consentimento:</strong> entre em contato conosco; a revogação pode
            limitar o uso do serviço.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Retenção e segurança">
        <p>
          Mantemos os dados enquanto sua conta estiver ativa. Ao excluir a conta, removemos perfis,
          histórico, votos, coleções e áudios privados que só você utilizava. Usamos conexões
          criptografadas e controles de acesso para que cada família veja apenas os próprios dados.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
