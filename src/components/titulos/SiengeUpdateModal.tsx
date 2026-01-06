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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SiengeUpdateModalProps {
  tituloId: string;
  open: boolean;
  onClose: () => void;
  idSienge: number;
  tipoDocumento: string;
  numeroDocumento: string;
}

const TIPOS_DOCUMENTO = [
  { value: 'nf', label: 'Nota Fiscal (NF)' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'recibo', label: 'Recibo' },
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'outros', label: 'Outros' },
];

export function SiengeUpdateModal({ 
  tituloId,
  open, 
  onClose, 
  idSienge, 
  tipoDocumento, 
  numeroDocumento 
}: SiengeUpdateModalProps) {
  const [documentIdentificationId, setDocumentIdentificationId] = useState(tipoDocumento);
  const [documentNumber, setDocumentNumber] = useState(numeroDocumento);
  const [isLoading, setIsLoading] = useState(false);

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
          documentIdentificationId,
          documentNumber,
        }),
      });

      if (response.ok) {
        // Atualiza no Supabase também
        const { error } = await supabase
          .from('titulos')
          .update({
            documento_tipo: documentIdentificationId,
            documento_numero: documentNumber,
          })
          .eq('id', tituloId);

        if (error) {
          console.error('Erro ao atualizar no Supabase:', error);
          toast.error('Sincronizado com Sienge, mas erro ao salvar localmente');
        } else {
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
            <Label htmlFor="tipoDocumento">Tipo de Documento</Label>
            <Select value={documentIdentificationId} onValueChange={setDocumentIdentificationId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_DOCUMENTO.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
