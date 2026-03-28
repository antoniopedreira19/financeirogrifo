

## Reorganizar Storage do Supabase por Obra e Tipo

### Resumo
Mudar a estrutura de pastas no bucket `titulo-documentos` para organizar por código da obra e tipo de arquivo. Também criar uma Edge Function para migrar os arquivos existentes.

### Nova estrutura de pastas
```text
titulo-documentos/
  {obra_codigo}/
    documentos/
      doc_{titulo_id}.pdf
    comprovantes/
      comprovante_{titulo_id}.pdf
    boletos/
      boleto_{titulo_id}.pdf
```

### Alterações

#### 1. Atualizar uploads no `TituloForm.tsx`
A função `uploadFile` atualmente salva em `{user_id}/{prefix}_{uuid}.{ext}`.
Mudar para `{obraCodigo}/{tipo}/{prefix}_{uuid}.{ext}`:
- Documento anexo (prefix `doc`) → `{obraCodigo}/documentos/doc_{uuid}.{ext}`
- Arquivo de pagamento (prefix `pagamento`) → `{obraCodigo}/boletos/pagamento_{uuid}.{ext}`

O `obraCodigo` já está disponível no componente via `selectedObra.codigo`.

#### 2. Atualizar uploads no `TituloDetailModal.tsx`
- `handleComprovanteUpload`: mudar path de `{user_id}/comprovante_{id}.{ext}` para `{obraCodigo}/comprovantes/comprovante_{id}.{ext}`
- `handleBoletoUpload`: mudar path de `{user_id}/boleto_{id}.{ext}` para `{obraCodigo}/boletos/boleto_{id}.{ext}`

O `obraCodigo` já está disponível via `tituloVisualizado.obraCodigo`.

#### 3. Leitura/download — sem alteração necessária
Os paths salvos no banco (`documento_url`, `boleto_url`, `arquivo_pagamento_url`) já são usados diretamente no `getPublicUrl`. Como atualizamos o path salvo, a leitura funciona automaticamente.

#### 4. Edge Function `reorganize-storage` — migração dos arquivos existentes
Criar uma Edge Function que:
1. Busca todos os títulos de `titulos` e `titulos_pendentes` que têm `documento_url`, `boleto_url` ou `arquivo_pagamento_url` preenchidos
2. Para cada arquivo encontrado:
   - Identifica o tipo pelo prefixo (`doc_`, `comprovante_`, `boleto_`, `pagamento_`)
   - Usa `obra_codigo` do título para montar o novo path
   - Copia o arquivo para o novo path (`download` + `upload`)
   - Atualiza a coluna correspondente no banco com o novo path
   - Remove o arquivo antigo
3. Retorna um relatório de quantos arquivos foram migrados

Será executada uma única vez, manualmente via Supabase Dashboard.

### Arquivos alterados
1. `src/components/titulos/TituloForm.tsx` — atualizar `uploadFile` para usar novo path
2. `src/components/titulos/TituloDetailModal.tsx` — atualizar `handleComprovanteUpload` e `handleBoletoUpload`
3. `supabase/functions/reorganize-storage/index.ts` — nova Edge Function de migração

