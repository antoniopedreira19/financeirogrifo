import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TituloDetailModal } from '@/components/titulos/TituloDetailModal';
import { StatusBadge } from '@/components/titulos/StatusBadge';
import { useTitulosByStatus } from '@/hooks/useTitulosQuery';
import { useAuth } from '@/contexts/AuthContext';
import { podeAprovar, podePagar, getLimiteFormatado, ROLE_LABELS } from '@/constants/aprovacao';
import { Titulo } from '@/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, CheckCircle, Clock, Wallet, Loader2, ShieldCheck, CalendarDays } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function ObraAprovacoes() {
  const { user, selectedObra } = useAuth();
  const { data: pendingTitulos = [], isLoading: loadingPending, refetch: refetchPending } = useTitulosByStatus('enviado');
  const { data: approvedTitulos = [], isLoading: loadingApproved, refetch: refetchApproved } = useTitulosByStatus('aprovado');
  const [selectedTitulo, setSelectedTitulo] = useState<Titulo | null>(null);
  const [filterToday, setFilterToday] = useState(false);

  useState(() => {
    refetchPending();
    refetchApproved();
  });

  const userRole = user?.role;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const parseDate = (dateValue: Date | string) => {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;
    const dateStr = String(dateValue);
    if (dateStr.length === 10) return new Date(dateStr + 'T12:00:00');
    return new Date(dateStr);
  };

  // Filter by selected obra AND value threshold for the user's role
  const filterByObraAndAlcada = (titulos: Titulo[], tipo: 'aprovacao' | 'pagamento' = 'aprovacao') => {
    if (!selectedObra || !userRole) return [];
    const checkFn = tipo === 'pagamento' ? podePagar : podeAprovar;
    return titulos
      .filter((t) => t.obraId === selectedObra.id)
      .filter((t) => checkFn(userRole, t.valorTotal));
  };

  const filterAndSort = (titulos: Titulo[], tipo: 'aprovacao' | 'pagamento' = 'aprovacao') => {
    let filtered = filterByObraAndAlcada(titulos, tipo);
    if (filterToday) {
      filtered = filtered.filter((t) => isToday(parseDate(t.dataVencimento)));
    }
    return [...filtered].sort((a, b) => {
      const dateA = parseDate(a.dataVencimento).getTime();
      const dateB = parseDate(b.dataVencimento).getTime();
      return dateA - dateB;
    });
  };

  const filteredPending = useMemo(() => filterAndSort(pendingTitulos, 'aprovacao'), [pendingTitulos, selectedObra, userRole, filterToday]);
  const filteredApproved = useMemo(() => filterAndSort(approvedTitulos, 'pagamento'), [approvedTitulos, selectedObra, userRole, filterToday]);

  const isLoading = loadingPending || loadingApproved;

  const TituloTable = ({ titulos, showPayButton = false }: { titulos: Titulo[]; showPayButton?: boolean }) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="table-header">
            <th className="text-left p-4">Credor</th>
            <th className="text-left p-4 hidden lg:table-cell">Solicitante</th>
            <th className="text-left p-4 hidden lg:table-cell">Vencimento</th>
            <th className="text-right p-4">Valor</th>
            <th className="text-center p-4">Status</th>
            <th className="text-center p-4">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {titulos.map((titulo) => (
            <tr key={titulo.id} className="hover:bg-muted/30 transition-colors">
              <td className="p-4">
                <div>
                  <p className="font-medium">{titulo.credor}</p>
                  <p className="text-sm text-muted-foreground">{titulo.numeroDocumento}</p>
                </div>
              </td>
              <td className="p-4 hidden lg:table-cell">
                <p className="text-sm">{titulo.criadoPorNome || '-'}</p>
              </td>
              <td className="p-4 hidden lg:table-cell">
                <p className="text-sm">
                  {format(parseDate(titulo.dataVencimento), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </td>
              <td className="p-4 text-right">
                <p className="font-semibold text-accent">{formatCurrency(titulo.valorTotal)}</p>
              </td>
              <td className="p-4 text-center">
                <StatusBadge status={titulo.status} size="sm" />
              </td>
              <td className="p-4 text-center">
                {showPayButton ? (
                  <Button variant="success" size="sm" onClick={() => setSelectedTitulo(titulo)} className="gap-1.5">
                    <Wallet className="h-4 w-4" />
                    Pagar
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setSelectedTitulo(titulo)} className="gap-1.5">
                    <Eye className="h-4 w-4" />
                    Analisar
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Aprovações</h1>
            <p className="text-muted-foreground mt-1">
              {selectedObra?.nome} — {userRole ? ROLE_LABELS[userRole] : ''}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 px-3 py-2 rounded-xl bg-muted/50 text-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <span className="text-muted-foreground">Aprovação:</span>
              <span className="font-semibold text-foreground">{userRole ? getLimiteFormatado(userRole, 'aprovacao') : '-'}</span>
            </div>
            {userRole && getLimiteFormatado(userRole, 'aprovacao') !== getLimiteFormatado(userRole, 'pagamento') && (
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-accent" />
                <span className="text-muted-foreground">Pagamento:</span>
                <span className="font-semibold text-foreground">{getLimiteFormatado(userRole, 'pagamento')}</span>
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Aguardando
                {filteredPending.length > 0 && (
                  <span className="bg-warning/20 text-warning text-xs font-semibold px-2 py-0.5 rounded-full">
                    {filteredPending.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Pagar
                {filteredApproved.length > 0 && (
                  <span className="bg-success/20 text-success text-xs font-semibold px-2 py-0.5 rounded-full">
                    {filteredApproved.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="sm:ml-auto">
              <div className="flex items-center gap-2">
                <Switch id="filter-today-obra" checked={filterToday} onCheckedChange={setFilterToday} />
                <Label htmlFor="filter-today-obra" className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  Títulos do dia
                </Label>
              </div>
            </div>
          </div>

          <TabsContent value="pending" className="mt-6">
            {filteredPending.length > 0 ? (
              <div className="card-elevated overflow-hidden">
                <TituloTable titulos={filteredPending} />
              </div>
            ) : (
              <div className="card-elevated p-8 text-center">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum título pendente</h3>
                <p className="text-muted-foreground">Todos os títulos da sua alçada foram analisados.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            {filteredApproved.length > 0 ? (
              <div className="card-elevated overflow-hidden">
                <TituloTable titulos={filteredApproved} showPayButton />
              </div>
            ) : (
              <div className="card-elevated p-8 text-center">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum pagamento pendente</h3>
                <p className="text-muted-foreground">Todos os títulos aprovados da sua alçada foram pagos.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <TituloDetailModal
        titulo={selectedTitulo}
        open={!!selectedTitulo}
        onClose={() => setSelectedTitulo(null)}
        showActions
      />
    </AppLayout>
  );
}
