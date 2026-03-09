

## Adicionar funcionalidade "Importar Boleto" no modal de detalhes

### O que é
Um botão para anexar um arquivo de boleto a qualquer título, independente do status. Diferente do comprovante e do documento anexo — é apenas um boleto associado ao título. Disponível para todos os perfis (admin, obra, orçamento).

### Alterações

#### 1. Migração SQL — nova coluna `boleto_url`
Adicionar coluna `boleto_url TEXT` nas tabelas `titulos` e `titulos_pendentes`. Permitir que qualquer usuário autenticado faça update nesse campo via RLS (ou ajustar policy existente).

#### 2. Atualizar tipos TypeScript (`src/types/index.ts`)
Adicionar `boletoUrl?: string` à interface `Titulo`.

#### 3. Atualizar o modal (`src/components/titulos/TituloDetailModal.tsx`)
- Adicionar um `useRef` para input de arquivo do boleto (similar ao comprovante)
- Adicionar função `handleBoletoUpload` que:
  - Valida tipo (PDF, JPEG, PNG) e tamanho (max 10MB)
  - Faz upload no bucket `titulo-documentos` com nome `boleto_{id}.{ext}`
  - Atualiza `boleto_url` na tabela correta (`titulos` ou `titulos_pendentes`)
  - Invalida queries
- Adicionar botão "Importar Boleto" ao lado do "Importar Comprovante" (na área de botões do topo)
- Adicionar seção "Boleto" na visualização, com botão para baixar/visualizar quando existir

#### 4. Mapear campo no `tituloVisualizado`
Garantir que `boleto_url` do banco seja mapeado para `boletoUrl` no objeto exibido.

### Resultado
Todos os perfis poderão anexar e visualizar um boleto em qualquer título, em qualquer status.

