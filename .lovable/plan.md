## Hierarquia de Aprovação por Valor com Roles em Cadeia

### Resumo
Implementar hierarquias de aprovação baseadas no valor do título, com novas roles e aprovação em cadeia. Admin é super-role (pode tudo).

### Níveis de Aprovação
| Nível | Faixa de Valor | Roles necessárias (em cadeia) |
|-------|---------------|-------------------------------|
| 1 | Até R$ 1.000 | engenheiro_assistente |
| 2 | R$ 1k - R$ 10k | engenheiro |
| 3 | R$ 10k - R$ 50k | admin → diretor_obra |
| 4 | Acima de R$ 50k | admin → diretor_obra → diretor |

Admin pode aprovar em QUALQUER nível (super-role).

### Etapas de Implementação

#### 1. Migração: Novas roles no enum `app_role`
```sql
ALTER TYPE app_role ADD VALUE 'engenheiro_assistente';
ALTER TYPE app_role ADD VALUE 'engenheiro';
ALTER TYPE app_role ADD VALUE 'diretor_obra';
ALTER TYPE app_role ADD VALUE 'diretor';
```

#### 2. Migração: Tabela `titulo_aprovacoes`
Rastreia cada aprovação individual na cadeia:
```sql
CREATE TABLE titulo_aprovacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo_id uuid NOT NULL,
  tabela_origem text NOT NULL CHECK (tabela_origem IN ('titulos_pendentes', 'titulos')),
  aprovado_por uuid NOT NULL,
  role_aprovador app_role NOT NULL,
  nivel int NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

#### 3. Migração: Funções SQL helpers
- `get_nivel_aprovacao(valor numeric)` → retorna nível (1-4)
- `get_roles_necessarias(valor numeric)` → retorna array de roles em ordem da cadeia
- `check_aprovacao_completa(titulo_id uuid, tabela text, valor numeric)` → verifica se todas as etapas da cadeia foram concluídas

#### 4. RLS: Políticas para `titulo_aprovacoes`
- SELECT: usuários autenticados da mesma empresa
- INSERT: usuários autenticados com role adequada para o nível

#### 5. Frontend: Tipos e constantes
- `src/types/index.ts`: Adicionar novas roles ao `UserRole`
- Labels e mapeamentos para UI

#### 6. Frontend: create-user Edge Function + AdminUsuarios
- Aceitar novas roles na criação de usuário
- Dropdown com todas as roles no formulário

#### 7. Frontend: Auth e Navegação
- `useSupabaseAuth.tsx`: Reconhecer novas roles
- `App.tsx`: Rotas para novas roles (acesso como obra)
- `Sidebar.tsx`: Menu adaptado por role
- `AuthContext.tsx`: Ajustar lógica de redirecionamento

#### 8. Frontend: TituloDetailModal — Cadeia de Aprovação
- Exibir progresso visual da cadeia (steps/timeline)
- Mostrar quem já aprovou e com qual role
- Botão "Aprovar" condicional: aparece se o user tem a role do próximo passo
- Admin sempre pode aprovar qualquer etapa
- Ao completar toda a cadeia, status muda para `aprovado`

### Arquivos alterados
1. Migrações SQL (enum, tabela, funções, RLS)
2. `src/types/index.ts`
3. `supabase/functions/create-user/index.ts`
4. `src/pages/admin/AdminUsuarios.tsx`
5. `src/hooks/useSupabaseAuth.tsx`
6. `src/contexts/AuthContext.tsx`
7. `src/App.tsx`
8. `src/components/layout/Sidebar.tsx`
9. `src/components/titulos/TituloDetailModal.tsx`
