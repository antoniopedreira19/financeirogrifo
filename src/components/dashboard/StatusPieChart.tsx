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

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

interface Props {
  titulos: Titulo[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg px-4 py-3 min-w-[180px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
        <span className="text-sm font-semibold text-foreground">{data.name}</span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Quantidade</span>
          <span className="font-medium text-foreground">{data.value}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Percentual</span>
          <span className="font-medium text-foreground">{data.percent}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Valor</span>
          <span className="font-medium text-foreground">{formatCurrency(data.valor)}</span>
        </div>
      </div>
    </div>
  );
};

export function StatusPieChart({ titulos }: Props) {
  const data = useMemo(() => {
    const counts: Record<string, { qty: number; valor: number }> = {};
    titulos.forEach((t) => {
      if (!counts[t.status]) counts[t.status] = { qty: 0, valor: 0 };
      counts[t.status].qty += 1;
      counts[t.status].valor += Number(t.valorTotal);
    });
    const total = titulos.length;
    return Object.entries(counts)
      .filter(([, v]) => v.qty > 0)
      .map(([status, v]) => ({
        name: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || status,
        value: v.qty,
        valor: v.valor,
        percent: total > 0 ? ((v.qty / total) * 100).toFixed(1) : '0',
        color: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.color || '#888',
      }));
  }, [titulos]);

  if (data.length === 0) return null;

  return (
    <div className="card-elevated p-6">
      <h3 className="text-lg font-semibold text-foreground mb-1">Títulos por Status</h3>
      <p className="text-sm text-muted-foreground mb-4">Distribuição dos títulos por situação atual</p>


      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
