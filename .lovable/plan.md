

## Plan: Add PIX confirmation dialog before submitting title

### What changes
Add an `AlertDialog` confirmation step in `TituloForm.tsx` that appears only when the payment method is PIX. When the user clicks "Enviar Título" and the method is PIX, instead of submitting immediately, show a dialog asking: **"Você confirma que o PIX está associado ao mesmo CNPJ da NF?"** with "Cancelar" and "Confirmo" buttons. Only on "Confirmo" does the actual submission proceed.

### Technical approach — `src/components/titulos/TituloForm.tsx`

1. **Add state**: `const [showPixConfirm, setShowPixConfirm] = useState(false)` and a ref to store validated form data temporarily.

2. **Split submit logic**: 
   - `handleSubmit(onSubmit)` validates the form as usual.
   - At the start of `onSubmit`, if `dadosBancarios.metodo_pagamento === "PIX"` and the confirmation hasn't been given yet, store the validated data, show the dialog, and `return` early.
   - When user clicks "Confirmo", call the actual submit logic with the stored data.

3. **Add AlertDialog** (already available in `@/components/ui/alert-dialog`):
   - Title: "Confirmação PIX"
   - Description: "Você confirma que o PIX está associado ao mesmo CNPJ da NF?"
   - Cancel button: "Cancelar"
   - Action button: "Confirmo"

4. No changes to webhooks, triggers, or backend — purely a frontend gate.

