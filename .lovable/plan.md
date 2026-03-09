

## Estudo Completo

### Webhooks encontrados no sistema

| # | Webhook URL | Origem | O que envia |
|---|-------------|--------|-------------|
| 1 | `webhook/titulos-sienge-pendentes` | Trigger SQL (`enviar_para_n8n`) na tabela `titulos_pendentes` | `row_to_json(NEW)` — todo o registro incluindo `dados_bancarios` |
| 2 | `webhook/titulos-sienge` | Trigger SQL (`enviar_titulo_para_n8n`) na tabela `titulos` | `row_to_json(NEW)` — todo o registro incluindo `dados_bancarios` |
| 3 | `webhook/pagamento-asaas` | Edge Function `pagamento-asaas` (chamada pelo `PaymentModal.tsx`) | Payload manual com `dados_bancarios: titulo.dadosBancarios` |
| 4 | `webhook/comprovante-importado` | `TituloDetailModal.tsx` (upload de comprovante) | Não envia `dados_bancarios` (irrelevante aqui) |
| 5 | `webhook/atualizar-sienge` | `SiengeUpdateModal.tsx` | Não envia `dados_bancarios` (irrelevante aqui) |

### Problema do `dados_bancarios` como string

Os webhooks 1, 2 e 3 recebem `dados_bancarios`. Nos exemplos que você colou, ainda chega como string escapada. Isso acontece porque **esses títulos foram criados antes da correção** (o `JSON.stringify` foi removido agora). Novos títulos já enviarão como objeto.

No entanto, o webhook 3 (`pagamento-asaas`) pode receber dados antigos que já estão como string no banco — esse caso continua funcionando porque o n8n recebe o valor tal como está.

### Alterações necessárias

#### 1. Formulário de Boleto — remover campo "Linha Digitável", manter só o upload de arquivo

No `DadosBancariosSection.tsx`:
- Remover o campo de input "Linha Digitável" da seção BOLETO
- Mudar o label de "Arquivo do Boleto (opcional)" para "Arquivo do Boleto"
- Tornar o upload obrigatório (já que não haverá mais linha digitável)

#### 2. Validação no TituloForm.tsx

Atualizar a validação do boleto (linha 251-253):
```
// ANTES:
if (metodo === "BOLETO" && !dadosBancarios.linha_digitavel?.trim() && !paymentFile) {
  toast.error("Informe a linha digitável ou anexe o boleto");
}

// DEPOIS:
if (metodo === "BOLETO" && !paymentFile) {
  toast.error("Anexe o arquivo do boleto");
}
```

#### 3. Modal de detalhes — exibição correta dos dados bancários

No `TituloDetailModal.tsx`:
- Substituir o label genérico "QR Code / Pix" por labels baseados no `dados_bancarios` real (PIX, Boleto, TED)
- Parsear strings JSON legadas antes de exibir
- Melhorar a formatação visual (campos em linhas separadas em vez de pipe-separated)
- Botão "Copiar" deve copiar apenas a chave PIX (para PIX) ou dados relevantes

#### 4. DadosBancariosStructured — remover campo `linha_digitavel`

Remover `linha_digitavel` do tipo `DadosBancariosStructured` já que boleto não terá mais esse campo — apenas o arquivo.

#### 5. JSON enviado aos webhooks

O JSON que chega nos webhooks 1 e 2 (triggers SQL) será:

**PIX:**
```json
"dados_bancarios": {
  "metodo_pagamento": "PIX",
  "tipo_chave_pix": "CELULAR",
  "chave_pix": "11951620055"
}
```

**Boleto:** (sem linha digitável, apenas o arquivo vai pelo `arquivo_pagamento_url`)
```json
"dados_bancarios": {
  "metodo_pagamento": "BOLETO"
}
```

**TED:**
```json
"dados_bancarios": {
  "metodo_pagamento": "TED",
  "banco": "001 - Banco do Brasil",
  "agencia": "1234",
  "conta": "12345-6",
  "tipo_conta": "corrente",
  "cpf_cnpj_titular": "00.000.000/0001-00"
}
```

O campo `tipo_leitura_pagamento` continua sendo preenchido como `pix`, `boleto` ou `ted` (lowercase do método).

### Arquivos alterados

1. **`src/components/titulos/DadosBancariosSection.tsx`** — remover campo linha digitável do boleto, tornar upload obrigatório, remover `linha_digitavel` do tipo
2. **`src/components/titulos/TituloForm.tsx`** — atualizar validação do boleto
3. **`src/components/titulos/TituloDetailModal.tsx`** — melhorar exibição dos dados bancários (parsear strings, labels corretos, formatação visual)

