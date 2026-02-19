import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Wallet, Loader2, Zap } from 'lucide-react';
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
  const [showAsaasConfirm, setShowAsaasConfirm] = useState(false);
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
    onClose();
  };

  const handleAsaasConfirm = async () => {
    if (!titulo) return;
    setShowAsaasConfirm(false);
    setIsProcessingAsaas(true);

    try {
      // A. Disparar webhook para o n8n
      await fetch('https://grifoworkspace.app.n8n.cloud/webhook/pagamento-asaas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: titulo.id,
          id_sienge: titulo.idSienge ?? null,
          valor_total: titulo.valorTotal,
          dados_bancarios: titulo.dadosBancarios ?? null,
          credor: titulo.credor,
          obra_codigo: titulo.obraCodigo,
          descricao: titulo.descricao ?? null,
        }),
      });

      // B. Atualizar status no Supabase
      const { error } = await supabase
        .from('titulos')
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
    <>
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

          <div className="space-y-4 mt-4">
            {/* Botão principal: Pagar Automaticamente */}
            <Button
              variant="success"
              className="w-full gap-2"
              onClick={() => setShowAsaasConfirm(true)}
              disabled={isLoading || isProcessingAsaas}
            >
              {isProcessingAsaas ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {isProcessingAsaas ? 'Enviando...' : 'Pagar Automaticamente (via Asaas)'}
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
        </DialogContent>
      </Dialog>

      {/* AlertDialog de confirmação Asaas */}
      <AlertDialog open={showAsaasConfirm} onOpenChange={setShowAsaasConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Pagamento via Asaas</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja processar o pagamento de{' '}
              <strong>{formatCurrency(valorTotal)}</strong> via Asaas agora?
              <br />
              <span className="text-muted-foreground text-xs mt-1 block">
                Uma ordem de pagamento será enviada automaticamente e o status será atualizado para "Processando".
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAsaasConfirm}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
