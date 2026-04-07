import { Titulo } from '@/types';
import { useMemo } from 'react';
import { Clock, TrendingUp, Percent, AlertTriangle } from 'lucide-react';

interface Props {
  titulos: Titulo[];
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

export function KpiCards({ titulos }: Props) {
  const kpis = useMemo(() => {
    const total = titulos.length;
    if (total === 0) return null;

    const aprovados = titulos.filter((t) => ['aprovado', 'pago', 'processando_pagamento'].includes(t.status));
    const reprovados = titulos.filter((t) => t.status === 'reprovado');
    const pagos = titulos.filter((t) => t.status === 'pago');

    const taxaAprovacao = total > 0 ? ((aprovados.length / total) * 100).toFixed(1) : '0';
    const taxaReprovacao = total > 0 ? ((reprovados.length / total) * 100).toFixed(1) : '0';

    // Ticket médio
    const ticketMedio = total > 0 ? titulos.reduce((s, t) => s + Number(t.valorTotal), 0) / total : 0;

    // Títulos vencidos (data_vencimento < hoje e status != pago)
    const hoje = new Date();
    const vencidos = titulos.filter((t) => {
      const venc = new Date(t.dataVencimento);
      return venc < hoje && !['pago', 'processando_pagamento', 'reprovado'].includes(t.status);
    });

    return { taxaAprovacao, taxaReprovacao, ticketMedio, vencidos: vencidos.length };
  }, [titulos]);

  if (!kpis) return null;

  const cards = [
    {
      label: 'Taxa de Aprovação',
      value: `${kpis.taxaAprovacao}%`,
      icon: <Percent className="h-4 w-4" />,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      label: 'Taxa de Reprovação',
      value: `${kpis.taxaReprovacao}%`,
      icon: <Percent className="h-4 w-4" />,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
    {
      label: 'Ticket Médio',
      value: formatCurrency(kpis.ticketMedio),
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      label: 'Títulos Vencidos',
      value: kpis.vencidos.toString(),
      icon: <AlertTriangle className="h-4 w-4" />,
      color: kpis.vencidos > 0 ? 'text-destructive' : 'text-success',
      bg: kpis.vencidos > 0 ? 'bg-destructive/10' : 'bg-success/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="card-elevated p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>{card.icon}</div>
          </div>
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <p className="text-xl lg:text-2xl font-bold text-foreground mt-1">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
