import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Loader2, Upload, Image, Sparkles } from 'lucide-react';
import { useEtapasByObra, useCreateEtapa, useDeleteEtapa, useBulkCreateEtapas, ObraEtapa } from '@/hooks/useEtapasQuery';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface EtapasManagerProps {
  obraId: string;
}

export function EtapasManager({ obraId }: EtapasManagerProps) {
  const { data: etapas = [], isLoading } = useEtapasByObra(obraId);
  const createEtapaMutation = useCreateEtapa();
  const deleteEtapaMutation = useDeleteEtapa();
  const bulkCreateMutation = useBulkCreateEtapas();
  const [newEtapa, setNewEtapa] = useState({ codigo: '', nome: '' });
  const [isExtractingFromImage, setIsExtractingFromImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddEtapa = () => {
    if (!newEtapa.codigo || !newEtapa.nome) {
      toast.error('Preencha código e nome da etapa');
      return;
    }

    createEtapaMutation.mutate(
      { obraId, codigo: newEtapa.codigo, nome: newEtapa.nome },
      {
        onSuccess: () => {
          setNewEtapa({ codigo: '', nome: '' });
          toast.success('Etapa adicionada');
        },
        onError: (error: any) => {
          if (error.code === '23505') {
            toast.error('Código de etapa já existe nesta obra');
          } else {
            toast.error('Erro ao adicionar etapa');
          }
        },
      }
    );
  };

  const handleDeleteEtapa = (etapa: ObraEtapa) => {
    deleteEtapaMutation.mutate(
      { etapaId: etapa.id, obraId },
      {
        onSuccess: () => toast.success('Etapa removida'),
        onError: () => toast.error('Erro ao remover etapa'),
      }
    );
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 10MB.');
      return;
    }

    setIsExtractingFromImage(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;

        try {
          const { data, error } = await supabase.functions.invoke('extract-etapas', {
            body: { imageBase64: base64 },
          });

          if (error) {
            console.error('Error calling function:', error);
            toast.error(error.message || 'Erro ao processar imagem');
            return;
          }

          if (data.error) {
            toast.error(data.error);
            return;
          }

          const extractedEtapas = data.etapas as { codigo: string; nome: string }[];

          if (!extractedEtapas || extractedEtapas.length === 0) {
            toast.error('Nenhuma etapa encontrada na imagem');
            return;
          }

          // Filter out duplicates
          const existingCodigos = new Set(etapas.map(e => e.codigo));
          const newEtapas = extractedEtapas.filter(e => !existingCodigos.has(e.codigo));

          if (newEtapas.length === 0) {
            toast.info('Todas as etapas já estão cadastradas');
            return;
          }

          // Bulk create new etapas
          bulkCreateMutation.mutate(
            { obraId, etapas: newEtapas },
            {
              onSuccess: () => {
                toast.success(`${newEtapas.length} etapas importadas com sucesso!`);
              },
              onError: (err: any) => {
                console.error('Bulk create error:', err);
                toast.error('Erro ao importar etapas');
              },
            }
          );
        } catch (err) {
          console.error('Error extracting etapas:', err);
          toast.error('Erro ao processar imagem');
        } finally {
          setIsExtractingFromImage(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };

      reader.onerror = () => {
        toast.error('Erro ao ler imagem');
        setIsExtractingFromImage(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Erro ao processar imagem');
      setIsExtractingFromImage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Etapas da Obra</Label>
        
        {/* Import from image button */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isExtractingFromImage || bulkCreateMutation.isPending}
          className="gap-2"
        >
          {isExtractingFromImage ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Extraindo...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Importar de Imagem
            </>
          )}
        </Button>
      </div>
      
      {/* Lista de etapas existentes */}
      {etapas.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {etapas.map((etapa) => (
            <div
              key={etapa.id}
              className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-sm text-primary">{etapa.codigo}</span>
                <span className="text-sm truncate">{etapa.nome}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteEtapa(etapa)}
                disabled={deleteEtapaMutation.isPending}
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Adicionar nova etapa manualmente */}
      <div className="flex gap-2">
        <Input
          placeholder="Código"
          value={newEtapa.codigo}
          onChange={(e) => setNewEtapa({ ...newEtapa, codigo: e.target.value })}
          className="input-field w-24"
        />
        <Input
          placeholder="Nome da etapa"
          value={newEtapa.nome}
          onChange={(e) => setNewEtapa({ ...newEtapa, nome: e.target.value })}
          className="input-field flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAddEtapa}
          disabled={createEtapaMutation.isPending}
        >
          {createEtapaMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>

      {etapas.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhuma etapa cadastrada. Adicione manualmente ou importe de uma imagem.
        </p>
      )}
    </div>
  );
}
