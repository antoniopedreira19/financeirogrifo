import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface RateioFinanceiroItem {
  centro_custo_id: string;
  percentual: number;
}

interface RateioFinanceiroListProps {
  items: RateioFinanceiroItem[];
  onChange: (items: RateioFinanceiroItem[]) => void;
  error?: string;
}

export function RateioFinanceiroList({ items, onChange, error }: RateioFinanceiroListProps) {
  const total = items.reduce((sum, item) => sum + (item.percentual || 0), 0);

  const addItem = () => {
    onChange([...items, { centro_custo_id: "", percentual: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof RateioFinanceiroItem, value: string | number) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Rateio Financeiro — Centro de Custo</Label>
        <span className={`text-xs font-medium ${total === 100 ? "text-emerald-600" : "text-destructive"}`}>
          Total: {total.toFixed(1)}%
        </span>
      </div>

      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            placeholder="Centro de custo (ex: 21101)"
            value={item.centro_custo_id}
            onChange={(e) => updateItem(index, "centro_custo_id", e.target.value)}
            className="input-field flex-1"
          />
          <div className="flex items-center gap-1 w-28 shrink-0">
            <Input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={item.percentual || ""}
              onChange={(e) => updateItem(index, "percentual", parseFloat(e.target.value) || 0)}
              className="input-field text-right"
              placeholder="%"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeItem(index)}
            disabled={items.length <= 1}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
        <Plus className="h-3.5 w-3.5" />
        Adicionar Centro de Custo
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
