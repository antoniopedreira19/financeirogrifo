import { Titulo } from '@/types';
import { useMemo, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Award } from 'lucide-react';

interface Props {
  titulos: Titulo[];
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

export function ApproverRankingTable({ titulos }: Props) {
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});

  // Collect unique approver IDs
  const approverIds = useMemo(() => {
    const ids = new Set<string>();
    titulos.forEach((t) => {
      if (t.aprovadoPor) ids.add(t.aprovadoPor);
    });
    return Array.from(ids);
  }, [titulos]);

  // Fetch profile names
  useEffect(() => {
    if (approverIds.length === 0) return;

    supabase
      .from('profiles')
      .select('id, nome')
      .in('id', approverIds)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((p) => (map[p.id] = p.nome));
          setProfileNames(map);
        }
      });
  }, [approverIds]);

  const ranking = useMemo(() => {
    const map: Record<string, { qty: number; valor: number }> = {};
    titulos.forEach((t) => {
      if (t.aprovadoPor && ['aprovado', 'pago', 'processando_pagamento'].includes(t.status)) {
        if (!map[t.aprovadoPor]) map[t.aprovadoPor] = { qty: 0, valor: 0 };
        map[t.aprovadoPor].qty += 1;
        map[t.aprovadoPor].valor += Number(t.valorTotal);
      }
    });

    return Object.entries(map)
      .map(([id, stats]) => ({
        id,
        nome: profileNames[id] || 'Carregando...',
        ...stats,
      }))
      .sort((a, b) => b.qty - a.qty);
  }, [titulos, profileNames]);

  const RankIcon = ({ position }: { position: number }) => {
    if (position === 0) return <Trophy className="h-4 w-4 text-accent" />;
    if (position === 1) return <Medal className="h-4 w-4 text-muted-foreground" />;
    if (position === 2) return <Award className="h-4 w-4 text-warning" />;
    return <span className="text-xs text-muted-foreground font-medium w-4 text-center">{position + 1}</span>;
  };

  if (ranking.length === 0) {
    return (
      <div className="card-elevated p-6">
        <h3 className="text-lg font-semibold text-foreground mb-1">Aprovadores</h3>
        <p className="text-sm text-muted-foreground">Nenhuma aprovação registrada.</p>
      </div>
    );
  }

  return (
    <div className="card-elevated p-6">
      <h3 className="text-lg font-semibold text-foreground mb-1">Ranking de Aprovadores</h3>
      <p className="text-sm text-muted-foreground mb-4">Quem mais aprovou títulos e volume financeiro</p>

      <div className="space-y-3">
        {ranking.slice(0, 8).map((approver, i) => (
          <div
            key={approver.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"
          >
            <RankIcon position={i} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{approver.nome}</p>
              <p className="text-xs text-muted-foreground">
                {approver.qty} {approver.qty === 1 ? 'título aprovado' : 'títulos aprovados'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{formatCurrency(approver.valor)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
