## O que estava quebrado

### Issue #26 — Selecionar outro filho não mudava o dashboard

**Sintoma:** ao escolher outro filho em «Quem vai ler hoje?» (`/perfis`), a home continuava a mostrar nome, faixa etária e biblioteca do filho antigo.

**Causa real (confirmada):** havia **dois `ChildProfileProvider` separados** — um em `/perfis` e outro dentro do `AppShell` (home, biblioteca, etc.). Ao seleccionar um filho, o estado actualizava só no provider de `/perfis`; ao navegar para `/home`, montava-se um provider novo que relia o cookie — muitas vezes ainda com o valor antigo, porque o browser ainda não tinha aplicado o `Set-Cookie` da server action anterior. Além disso, a biblioteca usava `getLibraryStoriesAction()` (só cookie) em vez de pedir explicitamente o `childProfileId` activo.

### Issue #27 — Excluir filho não fazia nada

**Causa:** `removeProfile()` apagava apenas no `localStorage`; a lista vinha da BD e o filho reaparecia. **Corrigido na revisão anterior** — Pedro confirmou que a exclusão funciona no preview.

---

## O que mudou nesta revisão

- **Um único `ChildProfileProvider`** no layout (`QueryProvider`), removido de `AppShell` e `/perfis`.
- **`selectProfile`** actualiza o estado React com o `profileId` devolvido por `setActiveChildProfile` (sem reler o cookie na hora) e invalida queries `['library']`.
- **Home e biblioteca** passam a usar `getChildStoriesAction(activeProfile.id)` — dados alinhados ao filho seleccionado no contexto.
- **UX `/perfis`:** clique no círculo selecciona e entra na app; removido «Continuar como {nome}»; hover com escala/anel em vez de ícone play.
- **E2E** reforçado: Davi → Maria → Davi, verificando faixa etária no dashboard.

### Exclusão de perfil (já entregue)

- Server action autorizada; cascade Prisma para histórias/favoritos/coleções; modal de confirmação + feedback. **Sem migration.**

---

## Testes

| Suite | Resultado |
|-------|-----------|
| `child-profile.service.test.ts` | ✅ 3/3 |
| `profiles/actions.test.ts` | ⚠️ Requer `DATABASE_URL` |
| E2E `child-profiles.spec.ts` | Adicionado (A→B→A + delete); requer Postgres local |
| Vercel preview | A verificar após push |

---

## Como testar no preview Vercel (Pedro)

**Pré-requisito:** conta Premium/Family com 2+ filhos (ex.: Test 3–5 anos, João 9–11 anos).

### A) Trocar filho (#26)

1. Login → `/perfis`.
2. Toque no círculo do **João** — deve ir directo para `/home` (sem «Continuar como…»).
3. **Esperado:** saudação com «João» e badge **9 a 11 anos**.
4. Volte a `/perfis` e toque em **Test**.
5. **Esperado:** home mostra **Test** e **3 a 5 anos**; biblioteca muda conforme o filho.
6. Abra **Biblioteca** e confirme que reflecte o filho activo.

### B) Excluir filho (#27)

1. **Configurações → Preferências por filho** → lixo num filho (com 2+ perfis).
2. Confirmar → desafio parental.
3. **Esperado:** «Perfil de … excluído com sucesso»; perfil some da lista.
4. Se era o activo, a app passa ao filho restante.

### C) UX `/perfis`

- Hover no círculo: escala suave + anel laranja (sem ícone play).
- Não deve aparecer «Continuar como {nome}».

---

Closes #26
Closes #27
