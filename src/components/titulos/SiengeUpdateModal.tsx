import { useState, useRef } from 'react';
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
import { Loader2, RefreshCw, Upload, X, FileText, Image } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SiengeUpdateModalProps {
  tituloId: string;
  open: boolean;
  onClose: () => void;
  idSienge: number;
  tipoDocumento: string;
  numeroDocumento: string;
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
  numeroDocumento 
}: SiengeUpdateModalProps) {
  const { user } = useAuth();
  const [documentNumber, setDocumentNumber] = useState(numeroDocumento);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Converte o tipo do banco para o código do Sienge
  const siengeDocType = TIPO_TO_SIENGE[tipoDocumento] || tipoDocumento.toUpperCase();

  const validateAndSetFile = (file: File) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato não suportado. Use PDF, JPEG ou PNG.");
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB.");
      return false;
    }
    setSelectedFile(file);
    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!selectedFile || !user) return null;

    const fileExt = selectedFile.name.split(".").pop();
    const fileName = `doc_${tituloId}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error } = await supabase.storage
      .from("titulo-documentos")
      .upload(filePath, selectedFile, { upsert: true });

    if (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar documento.");
      return null;
    }

    return filePath;
  };

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
        // Prepara os dados para atualização
        const updateData: { numero_documento: string; documento_url?: string } = {
          numero_documento: documentNumber,
        };

        // Upload do arquivo se existir
        if (selectedFile) {
          const filePath = await uploadFile();
          if (filePath) {
            updateData.documento_url = filePath;
          }
        }

        // Atualiza no Supabase também
        const { error } = await supabase
          .from('titulos')
          .update(updateData)
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

  const getFileIcon = () => {
    if (!selectedFile) return null;
    if (selectedFile.type === "application/pdf") return <FileText className="h-5 w-5 text-destructive" />;
    return <Image className="h-5 w-5 text-primary" />;
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

          {/* Upload de Documento */}
          <div className="space-y-2">
            <Label>Anexar Documento (opcional)</Label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
            />
            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Clique para anexar</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, JPEG ou PNG (máx. 10MB)</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                {getFileIcon()}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={removeFile} className="shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
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
