import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Titulo } from '@/types';
import { useMemo } from 'react';

const STATUS_CONFIG = {
  enviado: { label: 'Aguardando', color: 'hsl(38, 92%, 50%)' },
  aprovado: { label: 'Aprovados', color: 'hsl(142, 71%, 45%)' },
  reprovado: { label: 'Reprovados', color: 'hsl(0, 72%, 51%)' },
  pago: { label: 'Pagos', color: 'hsl(207, 93%, 25%)' },
  processando_pagamento: { label: 'Processando', color: 'hsl(37, 62%, 40%)' },
};

interface Props {
  titulos: Titulo[];
}

export function StatusPieChart({ titulos }: Props) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    titulos.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([status, value]) => ({
        name: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || status,
        value,
        color: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.color || '#888',
      }));
  }, [titulos]);

  if (data.length === 0) return null;

  return (
    <div className="card-elevated p-6">
      <h3 className="text-lg font-semibold text-foreground mb-1">Títulos por Status</h3>
      <p className="text-sm text-muted-foreground mb-4">Distribuição dos títulos por situação atual</p>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0 0% 100%)',
                border: '1px solid hsl(40 20% 85%)',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
              }}
              formatter={(value: number) => [`${value} títulos`, '']}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={10}
              wrapperStyle={{ fontSize: '0.8rem' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
