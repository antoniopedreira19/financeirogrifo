import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface RateioEngenhariaItem {
  etapa: string;
  percentual: number;
}

interface Etapa {
  id: string;
  codigo: string;
  nome: string;
}

interface RateioEngenhariaListProps {
  items: RateioEngenhariaItem[];
  onChange: (items: RateioEngenhariaItem[]) => void;
  etapas: Etapa[];
  error?: string;
}

export function RateioEngenhariaList({ items, onChange, etapas, error }: RateioEngenhariaListProps) {
  const total = items.reduce((sum, item) => sum + (item.percentual || 0), 0);
  const hasEtapas = etapas.length > 0;

  const addItem = () => {
    onChange([...items, { etapa: "", percentual: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof RateioEngenhariaItem, value: string | number) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Etapa da Obra</Label>
        <span className={`text-xs font-semibold ${total === 100 ? "text-emerald-600" : "text-destructive"}`}>
          {total.toFixed(0)}%
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            {hasEtapas ? (
              <Select
                value={item.etapa}
                onValueChange={(value) => updateItem(index, "etapa", value)}
              >
                <SelectTrigger className="input-field flex-1 min-w-0 truncate">
                  <SelectValue placeholder="Etapa" />
                </SelectTrigger>
                <SelectContent>
                  {etapas.map((etapa) => (
                    <SelectItem key={etapa.id} value={etapa.codigo}>
                      {etapa.codigo} - {etapa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Ex: 02.001"
                value={item.etapa}
                onChange={(e) => updateItem(index, "etapa", e.target.value)}
                className="input-field flex-1 min-w-0"
              />
            )}
            <div className="flex items-center gap-1 shrink-0">
              <Input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={item.percentual || ""}
                onChange={(e) => updateItem(index, "percentual", parseFloat(e.target.value) || 0)}
                className="input-field w-16 text-center"
                placeholder="%"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeItem(index)}
              disabled={items.length <= 1}
              className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1 text-xs h-8">
        <Plus className="h-3 w-3" />
        Adicionar
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
