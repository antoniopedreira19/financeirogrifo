import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Wallet, Loader2, Zap, AlertTriangle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface TituloAsaasData {
  id: string;
  idSienge?: number | null;
  valorTotal: number;
  dadosBancarios?: string | null;
  credor: string;
  obraCodigo: string;
  descricao?: string | null;
}

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (obs: string) => void;
  isLoading: boolean;
  credorName: string;
  valorTotal: number;
  titulo?: TituloAsaasData;
}

export function PaymentModal({ 
  open, 
  onClose, 
  onConfirm, 
  isLoading, 
  credorName,
  valorTotal,
  titulo,
}: PaymentModalProps) {
  const [obs, setObs] = useState('');
  const [confirmingAsaas, setConfirmingAsaas] = useState(false);
  const [isProcessingAsaas, setIsProcessingAsaas] = useState(false);
  const queryClient = useQueryClient();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleConfirmManual = () => {
    onConfirm(obs);
    setObs('');
  };

  const handleClose = () => {
    setObs('');
    setConfirmingAsaas(false);
    onClose();
  };

  const handleAsaasConfirm = async () => {
    if (!titulo) return;
    setIsProcessingAsaas(true);

    try {
      // A. Disparar webhook para o n8n via Edge Function (evita CORS)
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pagamento-asaas`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            id: titulo.id,
            id_sienge: titulo.idSienge ?? null,
            valor_total: titulo.valorTotal,
            dados_bancarios: titulo.dadosBancarios ?? null,
            credor: titulo.credor,
            obra_codigo: titulo.obraCodigo,
            descricao: titulo.descricao ?? null,
          }),
        }
      );

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Webhook falhou [${res.status}]: ${errBody}`);
      }

      // B. Atualizar status no Supabase
      const { error } = await supabase
        .from('titulos_pendentes')
        .update({ status: 'processando_pagamento' as any })
        .eq('id', titulo.id);

      if (error) throw error;

      toast.success('Ordem de pagamento enviada para o Asaas!');
      queryClient.invalidateQueries({ queryKey: ['titulos'] });
      handleClose();
    } catch (err: any) {
      console.error('Erro no pagamento Asaas:', err);
      toast.error(`Erro ao processar pagamento: ${err?.message ?? 'Erro desconhecido'}`);
    } finally {
      setIsProcessingAsaas(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-success" />
            Registrar Pagamento
          </DialogTitle>
          <DialogDescription>
            Confirme o pagamento do título de <strong>{credorName}</strong> no valor de{' '}
            <strong>{formatCurrency(valorTotal)}</strong>
          </DialogDescription>
        </DialogHeader>

        {confirmingAsaas ? (
          /* Tela de confirmação inline — sem AlertDialog */
          <div className="space-y-4 mt-4">
            <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Confirmar pagamento via Asaas?</p>
                <p className="text-sm text-muted-foreground">
                  Será enviada uma ordem de pagamento de{' '}
                  <strong>{formatCurrency(valorTotal)}</strong> para o Asaas. O status será
                  atualizado para <em>"Processando Pagamento"</em>.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => setConfirmingAsaas(false)}
                disabled={isProcessingAsaas}
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button
                variant="success"
                className="flex-1 gap-2"
                onClick={handleAsaasConfirm}
                disabled={isProcessingAsaas}
              >
                {isProcessingAsaas ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                {isProcessingAsaas ? 'Enviando...' : 'Confirmar e Enviar'}
              </Button>
            </div>
          </div>
        ) : (
          /* Tela inicial com as duas opções */
          <div className="space-y-4 mt-4">
            {/* Botão principal: Pagar Automaticamente */}
            <Button
              variant="success"
              className="w-full gap-2"
              onClick={() => setConfirmingAsaas(true)}
              disabled={isLoading || isProcessingAsaas}
            >
              <Zap className="h-4 w-4" />
              Pagar Automaticamente (via Asaas)
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            {/* Seção manual */}
            <div className="space-y-2">
              <Label htmlFor="obs">Observação (opcional)</Label>
              <Textarea
                id="obs"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Ex: Pago via PIX, comprovante enviado por email..."
                rows={3}
                className="input-field"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={isLoading || isProcessingAsaas}
              >
                Cancelar
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleConfirmManual}
                disabled={isLoading || isProcessingAsaas}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
                Registrar Pagamento (Manual)
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
