import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useCentrosCustoByObra, useCreateCentroCusto, useDeleteCentroCusto } from '@/hooks/useCentrosCustoQuery';
import { toast } from 'sonner';

interface CentrosCustoManagerProps {
  obraId: string;
}

export function CentrosCustoManager({ obraId }: CentrosCustoManagerProps) {
  const { data: centros = [], isLoading } = useCentrosCustoByObra(obraId);
  const createMutation = useCreateCentroCusto();
  const deleteMutation = useDeleteCentroCusto();
  const [novoCodigo, setNovoCodigo] = useState('');

  const handleAdd = () => {
    if (!novoCodigo.trim()) {
      toast.error('Informe o código do centro de custo');
      return;
    }

    createMutation.mutate(
      { obraId, codigo: novoCodigo.trim() },
      {
        onSuccess: () => {
          setNovoCodigo('');
          toast.success('Centro de custo adicionado');
        },
        onError: (error: any) => {
          if (error.code === '23505') {
            toast.error('Este código já existe nesta obra');
          } else {
            toast.error('Erro ao adicionar centro de custo');
          }
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(
      { id, obraId },
      {
        onSuccess: () => toast.success('Centro de custo removido'),
        onError: () => toast.error('Erro ao remover centro de custo'),
      }
    );
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
      <Label className="text-sm font-medium">Centros de Custos Associados</Label>

      {centros.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {centros.map((cc) => (
            <div
              key={cc.id}
              className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-lg"
            >
              <span className="font-mono text-sm text-primary">{cc.codigo}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(cc.id)}
                disabled={deleteMutation.isPending}
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Código do centro de custo"
          value={novoCodigo}
          onChange={(e) => setNovoCodigo(e.target.value)}
          className="input-field flex-1"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAdd}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>

      {centros.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhum centro de custo cadastrado. O formulário de título usará entrada livre.
        </p>
      )}
    </div>
  );
}
