# Roteiro de testes manuais — Issue #15 (LGPD / privacidade)

## Pré-requisitos

```bash
cp .env.example .env
# Preencher DATABASE_URL, DIRECT_URL, AUTH_SECRET
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

**Login seed:** `dev@pequenos-discipulos.local` / `devpassword123`

---

## 1. Páginas legais

| Passo | Ação | Resultado esperado |
|-------|------|-------------------|
| 1.1 | Abrir `/privacidade` | Política em pt-BR, aviso de rascunho, contato placeholder |
| 1.2 | Abrir `/termos` | Termos em pt-BR, link para privacidade |
| 1.3 | Verificar rodapé da landing `/` | Links para Privacidade e Termos |
| 1.4 | Verificar rodapé do `/login` | Links para Privacidade e Termos |

---

## 2. Consentimento — cadastro por e-mail

| Passo | Ação | Resultado esperado |
|-------|------|-------------------|
| 2.1 | Em `/login`, modo **Criar conta**, tentar cadastrar sem marcar checkbox | Mensagem pedindo aceite dos termos |
| 2.2 | Marcar checkbox, criar conta nova | Conta criada; redireciona para onboarding |
| 2.3 | (DB) Verificar `User.consentAcceptedAt` e `consentVersion` | Preenchidos com versão atual |

---

## 3. Consentimento — Google OAuth

| Passo | Ação | Resultado esperado |
|-------|------|-------------------|
| 3.1 | Login com Google (conta nova ou sem consentimento) | Tela `/consentimento` antes do onboarding/home |
| 3.2 | Aceitar termos | Redireciona para destino (home ou callback) |
| 3.3 | Tentar acessar `/home` sem consentimento | Redireciona para `/consentimento` |

---

## 4. Apelido da criança

| Passo | Ação | Resultado esperado |
|-------|------|-------------------|
| 4.1 | Onboarding passo 1 | Label "Apelido" com orientação sobre não usar nome completo |
| 4.2 | Configurações → editar perfil da criança | Mesma orientação de apelido |

---

## 5. Exportação de dados

| Passo | Ação | Resultado esperado |
|-------|------|-------------------|
| 5.1 | `/configuracoes` → **Baixar JSON** | Download de arquivo JSON |
| 5.2 | Abrir JSON | Contém conta, perfis, UserStory, views, votos — só do usuário logado |
| 5.3 | DevTools: GET `/api/account/export` sem cookie | **401** |

---

## 6. Exclusão de conta

| Passo | Ação | Resultado esperado |
|-------|------|-------------------|
| 6.1 | Configurações → Excluir conta → digitar texto errado | Botão desabilitado ou erro |
| 6.2 | Digitar `EXCLUIR MINHA CONTA` e confirmar | Conta apagada; redirect para `/` |
| 6.3 | Tentar login com e-mail excluído | Falha (conta não existe) |
| 6.4 | (Opcional) Conta com adaptação comunitária | Adaptação permanece com `createdByUserId` nulo |

---

## 7. Regressão

```bash
npm test
npx tsc --noEmit
npm run build
npm run lint
```

Todos devem passar antes de merge.
