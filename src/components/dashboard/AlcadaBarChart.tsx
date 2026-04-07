import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Titulo } from '@/types';
import { useMemo } from 'react';

const ALCADA_TIERS = [
  { label: 'Até R$ 1 mil', min: 0, max: 1_000, color: 'hsl(142, 71%, 45%)' },
  { label: 'R$ 1 mil – 10 mil', min: 1_000.01, max: 10_000, color: 'hsl(38, 92%, 50%)' },
  { label: 'R$ 10 mil – 50 mil', min: 10_000.01, max: 50_000, color: 'hsl(37, 62%, 40%)' },
  { label: 'Acima de R$ 50 mil', min: 50_000.01, max: Infinity, color: 'hsl(0, 72%, 51%)' },
];

interface Props {
  titulos: Titulo[];
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg px-4 py-3 min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
        <span className="text-sm font-semibold text-foreground">{data.name}</span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Quantidade</span>
          <span className="font-medium text-foreground">{data.quantidade}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Valor Total</span>
          <span className="font-medium text-foreground">{formatCurrency(data.valor)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Ticket Médio</span>
          <span className="font-medium text-foreground">
            {data.quantidade > 0 ? formatCurrency(data.valor / data.quantidade) : 'R$ 0'}
          </span>
        </div>
      </div>
    </div>
  );
};

export function AlcadaBarChart({ titulos }: Props) {
  const data = useMemo(() => {
    return ALCADA_TIERS.map((tier) => {
      const filtered = titulos.filter(
        (t) => Number(t.valorTotal) >= tier.min && Number(t.valorTotal) <= tier.max
      );
      return {
        name: tier.label,
        quantidade: filtered.length,
        valor: filtered.reduce((s, t) => s + Number(t.valorTotal), 0),
        color: tier.color,
      };
    });
  }, [titulos]);

  return (
    <div className="card-elevated p-6">
      <h3 className="text-lg font-semibold text-foreground mb-1">Títulos por Alçada</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Quantidade de títulos por faixa de valor (alçada de aprovação)
      </p>


      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 50 }}>
            <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
            <Bar dataKey="quantidade" radius={[0, 6, 6, 0]} barSize={28}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList dataKey="quantidade" position="right" fontSize={12} fontWeight={600} fill="hsl(var(--foreground))" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
