
# Plano: Corrigir Carregamento Completo dos Credores

## Problema Identificado

O sistema busca todos os credores da tabela `sienge_credores` usando Supabase, mas a biblioteca impoe um **limite padrao de 1000 registros por requisicao**. Como existem 8.421 credores no banco, a maioria nao esta sendo carregada.

O credor "F & S Materiais de Construção Eireli - EPP" (creditor_id: 1, nome_fantasia: Macosan) existe no banco mas nao esta sendo encontrado porque nao foi incluido no lote inicial de 1000 registros.

---

## Solucao Proposta

Modificar a query no hook `useCredoresQuery` para buscar todos os registros em lotes ou remover o limite.

### Alteracoes Tecnicas

**Arquivo:** `src/hooks/useCredoresQuery.tsx`

1. **Adicionar paginacao completa** - Buscar todos os registros usando o metodo `.range()` do Supabase em um loop, ou usar o header `Prefer: count=exact` junto com consultas paginadas.

2. **Abordagem mais simples** - Definir um range explicito para buscar todos os 8.421 registros de uma vez:

```typescript
const { data, error } = await supabase
  .from('sienge_credores')
  .select('id, creditor_id, nome, nome_fantasia, doc, tipo')
  .order('nome', { ascending: true })
  .range(0, 9999); // Buscar ate 10.000 registros
```

3. **Abordagem robusta (opcional)** - Implementar busca paginada que faz multiplas requisicoes ate obter todos os registros, ideal se a tabela crescer muito no futuro.

---

## Resumo das Mudancas

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useCredoresQuery.tsx` | Adicionar `.range(0, 9999)` na query para garantir que todos os 8.421 credores sejam carregados |

---

## Resultado Esperado

- Ao digitar "f &", aparecera "F & S Materiais de Construcao Eireli - EPP"
- Ao digitar "macosan", aparecera o mesmo credor (buscando pelo nome_fantasia)
- Todos os 8.421 credores estarao disponiveis para busca
