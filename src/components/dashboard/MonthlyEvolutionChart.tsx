import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Titulo } from '@/types';
import { useMemo } from 'react';
import { format, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  titulos: Titulo[];
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

export function MonthlyEvolutionChart({ titulos }: Props) {
  const data = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; start: Date; end: Date }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const start = startOfMonth(d);
      const end = i === 0 ? now : startOfMonth(subMonths(now, i - 1));
      months.push({
        key: format(d, 'yyyy-MM'),
        label: format(d, 'MMM/yy', { locale: ptBR }),
        start,
        end,
      });
    }

    return months.map((m) => {
      const monthTitulos = titulos.filter((t) => {
        const created = new Date(t.createdAt);
        return created >= m.start && created < m.end;
      });

      return {
        name: m.label,
        criados: monthTitulos.length,
        valorCriados: monthTitulos.reduce((s, t) => s + Number(t.valorTotal), 0),
        pagos: monthTitulos.filter((t) => t.status === 'pago').length,
        valorPago: monthTitulos
          .filter((t) => t.status === 'pago')
          .reduce((s, t) => s + Number(t.valorTotal), 0),
      };
    });
  }, [titulos]);

  return (
    <div className="card-elevated p-6">
      <h3 className="text-lg font-semibold text-foreground mb-1">Evolução Mensal</h3>
      <p className="text-sm text-muted-foreground mb-4">Títulos criados vs pagos nos últimos 6 meses</p>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(40 20% 85%)" vertical={false} />
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0 0% 100%)',
                border: '1px solid hsl(40 20% 85%)',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'criados') return [value, 'Criados'];
                if (name === 'pagos') return [value, 'Pagos'];
                return [value, name];
              }}
            />
            <Bar dataKey="criados" fill="hsl(207, 93%, 25%)" radius={[4, 4, 0, 0]} barSize={24} name="criados" />
            <Bar dataKey="pagos" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} barSize={24} name="pagos" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-6 mt-3 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(207, 93%, 25%)' }} />
          <span className="text-xs text-muted-foreground">Criados</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(142, 71%, 45%)' }} />
          <span className="text-xs text-muted-foreground">Pagos</span>
        </div>
      </div>
    </div>
  );
}
