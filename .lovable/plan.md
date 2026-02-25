

## Problema

O webhook `titulos-sienge-pendentes` recebe `dados_bancarios` como **string** porque o formulário de criação de título (`TituloForm.tsx`, linha 327) ainda faz `JSON.stringify(dadosBancarios)` antes de passar para a mutation.

O fluxo atual:
1. Formulário cria o objeto estruturado `{ metodo_pagamento: "PIX", chave_pix: "..." }`
2. **Converte para string** com `JSON.stringify()` na linha 327
3. Mutation envia a string para o Supabase (que armazena como texto dentro do JSONB)
4. Trigger `enviar_para_n8n` usa `row_to_json(NEW)` — que preserva o valor tal como está (string)
5. Webhook recebe `dados_bancarios` como string escapada

## Correção

Uma única alteração no arquivo `src/components/titulos/TituloForm.tsx`:

**Linha 327** — remover o `JSON.stringify`:
```typescript
// ANTES:
dadosBancarios: JSON.stringify(dadosBancarios),

// DEPOIS:
dadosBancarios: dadosBancarios,
```

Isso faz o objeto JSONB ser salvo como objeto real no banco, e o trigger enviará o JSON estruturado para o webhook.

## Observação

Títulos já criados antes dessa correção continuarão com `dados_bancarios` como string no banco. Apenas novos títulos terão o formato correto.

