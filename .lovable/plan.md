## Hierarquia de Aprovação por Alçada de Valor

### Resumo
Adicionar novas roles ao sistema. Cada role tem uma alçada (valor máximo que pode aprovar). Roles superiores podem aprovar tudo que as inferiores podem. Admin é super-role (aprova qualquer valor).

### Alçadas por Role
| Role | Pode aprovar títulos até |
|------|--------------------------|
| engenheiro_assistente | R$ 1.000 |
| engenheiro | R$ 10.000 |
| diretor_obra | R$ 50.000 |
| diretor | Qualquer valor |
| admin | Qualquer valor (super-role) |

### Quem vê o botão "Aprovar" em cada faixa
| Faixa de Valor | Roles que podem aprovar |
|----------------|------------------------|
| Até R$ 1.000 | engenheiro_assistente, engenheiro, diretor_obra, diretor, admin |
| R$ 1k - R$ 10k | engenheiro, diretor_obra, diretor, admin |
| R$ 10k - R$ 50k | diretor_obra, diretor, admin |
| Acima de R$ 50k | diretor, admin |

### Etapas de Implementação

#### 1. Migração SQL: Novas roles no enum `app_role`
```sql
ALTER TYPE app_role ADD VALUE 'engenheiro_assistente';
ALTER TYPE app_role ADD VALUE 'engenheiro';
ALTER TYPE app_role ADD VALUE 'diretor_obra';
ALTER TYPE app_role ADD VALUE 'diretor';
```
Sem tabela extra de aprovações — o fluxo atual (aprovar/reprovar em titulos_pendentes) continua igual.

#### 2. Frontend: Tipos e constantes de alçada
- `src/types/index.ts`: Adicionar novas roles ao `UserRole`
- Novo arquivo `src/constants/aprovacao.ts`: Mapa de alçadas e função `podeAprovar(role, valorTitulo)`

#### 3. Frontend: useSupabaseAuth + AuthContext
- Reconhecer as novas roles vindas de `user_roles`
- Mapear para navegação correta (novas roles acessam como "obra" — veem títulos, aprovam conforme alçada)

#### 4. Frontend: App.tsx + Sidebar
- Rotas: novas roles acessam as mesmas páginas de obra + página de aprovações
- Sidebar: menu adaptado (engenheiro/diretor veem "Aprovações" se tiverem alçada)

#### 5. Frontend: TituloDetailModal — Botão de aprovação condicional
- Verificar `podeAprovar(userRole, titulo.valorTotal)` 
- Se true: mostra botão "Aprovar" / "Reprovar"
- Se false: não mostra os botões (apenas visualização)
- Admin sempre vê os botões

#### 6. Frontend: AdminUsuarios — Dropdown com todas as roles
- Atualizar dropdown "Tipo de Usuário" para incluir as novas roles
- Labels: Administrador, Equipe de Obra, Orçamento, Eng. Assistente, Engenheiro, Diretor de Obra, Diretor
- Edge Function `create-user`: aceitar novas roles

### Arquivos alterados
1. Migração SQL (apenas enum)
2. `src/types/index.ts`
3. `src/constants/aprovacao.ts` (novo)
4. `src/hooks/useSupabaseAuth.tsx`
5. `src/contexts/AuthContext.tsx`
6. `src/App.tsx`
7. `src/components/layout/Sidebar.tsx`
8. `src/components/titulos/TituloDetailModal.tsx`
9. `src/pages/admin/AdminUsuarios.tsx`
10. `supabase/functions/create-user/index.ts`
