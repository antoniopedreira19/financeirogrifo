
## Diagnóstico do Problema

### O que está acontecendo

O `PaymentModal` funciona como um `Dialog` independente, porém ele internamente contém um `AlertDialog` (para confirmar o pagamento via Asaas). Quando o botão "Pagar Automaticamente (via Asaas)" é clicado dentro do `PaymentModal`, o `AlertDialog` tenta abrir mas enfrenta conflito de **portals e focus traps do Radix UI**: dois overlays modais tentam coexistir no DOM, e o Radix UI não suporta bem esse cenário — um fecha o outro ou bloqueia a interação.

O resultado: o usuário vê apenas o `Dialog` principal do `PaymentModal` com os dois botões (o código está correto), mas ao clicar em "Pagar Automaticamente", o `AlertDialog` ou não abre, ou fecha imediatamente o `PaymentModal`.

Na imagem enviada, você está vendo o modal de detalhe do título (`TituloDetailModal`) com apenas o botão verde "Registrar Pagamento" — esse é o comportamento correto. Ao clicar nesse botão, o `PaymentModal` **deveria abrir** com os dois botões. Se isso não está acontecendo, pode ser um problema de estado (`showPaymentModal`).

### Causa Raiz

Há dois problemas combinados:

1. **`AlertDialog` dentro de `PaymentModal` (Dialog dentro de Dialog):** Ao clicar em "Pagar Automaticamente", o `setShowAsaasConfirm(true)` tenta abrir um `AlertDialog` que é filho de um `Dialog`. O Radix UI detecta a sobreposição de modais e impede a abertura correta.

2. **Confirmação inline:** A solução mais simples e robusta é eliminar o `AlertDialog` de confirmação e substituir por uma **confirmação inline** (um estado de confirmação dentro do próprio `PaymentModal`), mostrando os botões "Confirmar" e "Cancelar" diretamente no Dialog — sem abrir um segundo modal.

### Solução Proposta

Refatorar o `PaymentModal` para usar confirmação inline em vez de `AlertDialog`:

**Fluxo novo:**
```
Usuário clica "Pagar Automaticamente"
    → dentro do Dialog, a UI muda para modo confirmação
    → Mostra: mensagem de confirmação + botões "Cancelar" / "Confirmar e Enviar"
    → Se confirmar: dispara webhook + atualiza Supabase
    → Se cancelar: volta para a tela inicial do PaymentModal
```

Isso elimina completamente o conflito de portals do Radix UI.

### Arquivos a Modificar

- `src/components/titulos/PaymentModal.tsx` — remover o `AlertDialog`, adicionar estado `confirmingAsaas` para controlar a tela de confirmação inline

### Detalhes Técnicos

No `PaymentModal`, adicionar um estado `confirmingAsaas: boolean`. Quando o usuário clica em "Pagar Automaticamente":
- Em vez de abrir um `AlertDialog`, define `confirmingAsaas = true`
- O conteúdo do Dialog muda condicionalmente: se `confirmingAsaas`, mostra a tela de confirmação com valor e dois botões (Cancelar volta ao estado normal, Confirmar executa o webhook)
- Remove completamente o `AlertDialog` e seus imports

Isso garante compatibilidade total com o Radix UI em desktop e mobile, sem conflito de portals.
