import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Titulo } from '@/types';
import { useMemo } from 'react';

interface Props {
  titulos: Titulo[];
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

export function ObraBreakdownChart({ titulos }: Props) {
  const data = useMemo(() => {
    const map: Record<string, { nome: string; qty: number; valor: number }> = {};
    titulos.forEach((t) => {
      const key = t.obraId;
      if (!map[key]) map[key] = { nome: t.obraNome || t.obraCodigo || key, qty: 0, valor: 0 };
      map[key].qty += 1;
      map[key].valor += Number(t.valorTotal);
    });

    return Object.values(map)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8)
      .map((d) => ({
        name: d.nome.length > 18 ? d.nome.substring(0, 18) + '…' : d.nome,
        fullName: d.nome,
        quantidade: d.qty,
        valor: d.valor,
      }));
  }, [titulos]);

  if (data.length === 0) return null;

  return (
    <div className="card-elevated p-6">
      <h3 className="text-lg font-semibold text-foreground mb-1">Volume por Obra</h3>
      <p className="text-sm text-muted-foreground mb-4">Valor total de títulos por obra</p>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis
              type="number"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCurrency(v)}
            />
            <YAxis type="category" dataKey="name" width={140} fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0 0% 100%)',
                border: '1px solid hsl(40 20% 85%)',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'valor') return [formatCurrency(value), 'Valor'];
                return [value, name];
              }}
              labelFormatter={(label) => {
                const item = data.find((d) => d.name === label);
                return item?.fullName || label;
              }}
            />
            <Bar dataKey="valor" fill="hsl(207, 93%, 25%)" radius={[0, 6, 6, 0]} barSize={24} name="valor" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
