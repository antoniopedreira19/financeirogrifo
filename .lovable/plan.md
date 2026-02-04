
## Diagnóstico (por que “macosan” e “f & s” não aparecem)

1) **O registro existe no banco**  
Eu confirmei via SQL que existe:
- `creditor_id = 1`
- `nome = "F & S Materiais de Construção Eireli - EPP"`
- `nome_fantasia = "Macosan"`
- `tipo = "J"`

2) **O problema mais provável: o front não tem esse registro em memória**  
Hoje o combobox faz **filtro no cliente** (JavaScript) em cima do array `allCredores` carregado no hook `useCredoresQuery()`.

Se o `allCredores` tiver só os **primeiros ~1000 itens**, qualquer credor que esteja depois disso no `order('nome')` nunca vai aparecer no filtro.  
E isso pode acontecer por dois motivos comuns:
- **Limite “máximo de linhas por requisição” do PostgREST/Supabase**: mesmo pedindo `limit=10000`, a API pode estar configurada para **entregar no máximo 1000** por chamada.
- **Cache do React Query**: se você já tinha carregado 1000 antes, o React Query pode manter isso por 30 minutos (staleTime) sem refazer o fetch em algumas situações (especialmente com navegação sem refresh).

Isso explica perfeitamente o seu sintoma: você digita certo, mas o match não vem porque o item não está no array.

---

## Passo a passo (como eu vou depurar e corrigir de forma definitiva)

### Parte A — Validação rápida (antes da refatoração)
1. Vou adicionar um “indicador” no próprio dropdown (ou no console) mostrando:
   - `totalCount` carregado (tamanho de `allCredores`)
2. Você testa na tela:
   - Se aparecer algo como **“Carregados: 1000”**, está confirmado: o problema é “não trouxe todos”.

### Parte B — Correção robusta (sem depender de limite do Supabase)
Vou mudar `useCredoresQuery()` para **buscar em páginas de 1000** e juntar tudo, até terminar.

- Page 1: range `0..999`
- Page 2: range `1000..1999`
- ...
- Última página: volta com `< 1000` itens → para

Isso funciona mesmo que o Supabase tenha um cap de 1000 por requisição, porque a gente nunca pede mais que 1000 por chamada.

Além disso, para garantir que você não fique preso num cache antigo:
- Vou **alterar o `queryKey`** (ex.: `['sienge_credores', 'v2']`) para forçar refetch imediato quando atualizar.

### Parte C — Melhorar o “match” de busca (qualidade da pesquisa)
Vou reforçar o filtro para ser mais “humano”:

1) **Ignorar acentos**  
Ex.: “Jose” encontra “José” (muito importante em PT-BR).

2) **Ignorar pontuação e múltiplos espaços**  
Ex.: “f & s” encontra “F & S …” mesmo que venha com variações de espaços.

Implementação (conceito):
- Criar uma função `normalizeText()` que:
  - `trim()`
  - `toLowerCase()`
  - remove acentos com `normalize('NFD')` + regex de diacríticos
  - troca pontuação por espaço
  - colapsa espaços (`\s+` → `' '`)

Depois comparar `includes()` em:
- `normalize(nome)`
- `normalize(nome_fantasia)`

---

## Mudanças no código (arquivos e o que será feito)

### 1) `src/hooks/useCredoresQuery.tsx`
- Trocar o fetch único por um fetch paginado em loop:
  - `PAGE_SIZE = 1000`
  - concatena resultados até acabar
- Bump do cache:
  - `queryKey: ['sienge_credores', 'v2']`
- Manter cache (staleTime/gcTime) para não ficar refazendo à toa

### 2) `src/hooks/useCredoresQuery.tsx` (filtro)
- Melhorar `useCredoresFilter()` com normalização (acentos/pontuação)
- Continuar limitando a exibição para 50 itens no dropdown

### 3) `src/components/titulos/CredorCombobox.tsx`
- Exibir `totalCount` carregado (opcional, mas recomendado durante validação)
  - Ex.: “Base carregada: 8421 credores”
- (Se preferir, deixo só um `console.info` e removo depois)

---

## Como testar (checklist exato)
1) Faça um refresh completo da página (Ctrl+Shift+R) após a mudança.
2) Abra “Novo Título”.
3) Digite:
   - `macosan` → deve aparecer **F & S Materiais...** (fantasia “Macosan”)
   - `f & s` → deve aparecer o mesmo credor
4) Confira o indicador “Base carregada: 8421” (ou próximo disso).
5) Clique no credor:
   - `Nome` preenchido
   - `Documento` preenchido
   - Tipo marcado como **CNPJ** (porque tipo = J)
   - `creditor_id` exibido
6) Teste modo manual:
   - digite um nome inexistente → lista vazia → mantenha texto
   - `creditor_id` deve ficar `null`
7) Envie/Salve e valide que:
   - `titulos_pendentes.creditor_id` grava número quando selecionado
   - grava `null` quando manual
   - no webhook o campo também aparece corretamente (mantendo o mesmo payload que já está sendo montado hoje)

---

## Observação (melhoria futura, se você quiser)
Se a base crescer muito (ex.: 50k+), a abordagem ideal vira “buscar no banco a cada digitação” (server-side search com debounce). Para 8.4k, carregar tudo uma vez e filtrar no cliente costuma ficar ótimo e extremamente responsivo, desde que a carga completa esteja garantida (paginada) e com cache.

---

## Sugestões do que você pode querer em seguida (quando isso estiver OK)
1) Testar o fluxo ponta a ponta: seleção do credor → salvar → verificar no banco e no webhook.
2) Tornar a busca tolerante a “CPF/CNPJ digitado” (buscar também por `doc`).
3) Adicionar um botão “Recarregar base de credores” para quando você atualizar a tabela no Sienge.
4) Mostrar no dropdown “Nome + Fantasia + Documento” com destaque do trecho pesquisado.
5) Registrar métricas simples (tempo de carregamento da base e número de registros) para monitorar performance.
