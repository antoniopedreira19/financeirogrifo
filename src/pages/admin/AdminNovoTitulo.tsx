import { AppLayout } from '@/components/layout/AppLayout';
import { TituloForm } from '@/components/titulos/TituloForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useObrasQuery } from '@/hooks/useObrasQuery';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Obra } from '@/types';

export default function AdminNovoTitulo() {
  const navigate = useNavigate();
  const { data: obras = [], isLoading } = useObrasQuery();
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);

  const handleObraSelect = (obraId: string) => {
    const obra = obras.find(o => o.id === obraId);
    setSelectedObra(obra || null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Novo Título (Admin)
            </h1>
            <p className="text-muted-foreground mt-1">
              Crie um título para qualquer obra
            </p>
          </div>
        </div>

        {/* Obra Selector */}
        <div className="card-elevated p-6">
          <h2 className="text-lg font-semibold mb-4">Selecionar Obra</h2>
          <div className="space-y-2">
            <Label>Obra</Label>
            <Select onValueChange={handleObraSelect} disabled={isLoading}>
              <SelectTrigger className="input-field max-w-md">
                <SelectValue placeholder={isLoading ? "Carregando obras..." : "Selecione a obra"} />
              </SelectTrigger>
              <SelectContent>
                {obras.filter(o => o.ativa).map((obra) => (
                  <SelectItem key={obra.id} value={obra.id}>
                    {obra.codigo} - {obra.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Form - only show when obra is selected */}
        {selectedObra ? (
          <TituloForm selectedObraOverride={selectedObra} redirectPath="/admin/titulos" />
        ) : (
          <div className="card-elevated p-12 text-center text-muted-foreground">
            Selecione uma obra acima para continuar
          </div>
        )}
      </div>
    </AppLayout>
  );
}
