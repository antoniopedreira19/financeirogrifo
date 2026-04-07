import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
            <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={130}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0 0% 100%)',
                border: '1px solid hsl(40 20% 85%)',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'valor') return [formatCurrency(value), 'Valor Total'];
                return [value, 'Quantidade'];
              }}
            />
            <Bar dataKey="quantidade" radius={[0, 6, 6, 0]} barSize={28}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
