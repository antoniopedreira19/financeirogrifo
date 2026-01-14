import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface SiengeUpdateModalProps {
  tituloId: string;
  open: boolean;
  onClose: () => void;
  idSienge: number;
  tipoDocumento: string;
  numeroDocumento: string;
  status: string;
}

// Mapeia os tipos do banco para os códigos do Sienge
const TIPO_TO_SIENGE: Record<string, string> = {
  nota_fiscal: 'NF',
  boleto: 'BOL',
  recibo: 'REC',
  contrato: 'CTR',
  outros: 'OUT',
  outro: 'OUT',
};

export function SiengeUpdateModal({ 
  tituloId,
  open, 
  onClose, 
  idSienge, 
  tipoDocumento, 
  numeroDocumento,
  status,
}: SiengeUpdateModalProps) {
  const queryClient = useQueryClient();
  const [documentNumber, setDocumentNumber] = useState(numeroDocumento);
  const [isLoading, setIsLoading] = useState(false);

  // Converte o tipo do banco para o código do Sienge
  const siengeDocType = TIPO_TO_SIENGE[tipoDocumento] || tipoDocumento.toUpperCase();

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://grifoworkspace.app.n8n.cloud/webhook/atualizar-sienge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_sienge: idSienge,
          documentIdentificationId: siengeDocType,
          documentNumber,
        }),
      });

      if (response.ok) {
        // Determina qual tabela atualizar com base no status
        const tableName = status === 'pago' ? 'titulos' : 'titulos_pendentes';
        
        const { error } = await supabase
          .from(tableName)
          .update({ numero_documento: documentNumber })
          .eq('id', tituloId);

        if (error) {
          console.error('Erro ao atualizar no Supabase:', error);
          toast.error('Sincronizado com Sienge, mas erro ao salvar localmente');
        } else {
          // Invalida as queries para refletir a mudança no frontend
          queryClient.invalidateQueries({ queryKey: ['titulos'] });
          queryClient.invalidateQueries({ queryKey: ['titulos_pendentes'] });
          queryClient.invalidateQueries({ queryKey: ['titulo_modal', tituloId] });
          toast.success('Sincronizado com Sienge!');
        }
        onClose();
      } else {
        toast.error('Erro ao sincronizar com Sienge');
      }
    } catch (error) {
      toast.error('Erro ao sincronizar com Sienge');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Atualizar no Sienge
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="idSienge">ID Sienge</Label>
            <Input
              id="idSienge"
              value={idSienge}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numeroDocumento">Número do Documento</Label>
            <Input
              id="numeroDocumento"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="Ex: 12345"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Atualizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}