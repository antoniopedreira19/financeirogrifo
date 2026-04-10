import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TituloDetailModal } from '@/components/titulos/TituloDetailModal';
import { StatusBadge } from '@/components/titulos/StatusBadge';
import { useTitulosByStatus } from '@/hooks/useTitulosQuery';
import { useObrasQuery } from '@/hooks/useObrasQuery';
import { Titulo } from '@/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, CheckCircle, Clock, Wallet, Loader2, CalendarDays } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { isToday } from 'date-fns';

export default function AdminAprovacoes() {
  const { data: pendingTitulos = [], isLoading: loadingPending, refetch: refetchPending } = useTitulosByStatus('enviado');
  const { data: approvedTitulos = [], isLoading: loadingApproved, refetch: refetchApproved } = useTitulosByStatus('aprovado');
  const { data: obras = [] } = useObrasQuery();
  const [selectedTitulo, setSelectedTitulo] = useState<Titulo | null>(null);
  const [filterObra, setFilterObra] = useState<string>('all');
  const [filterToday, setFilterToday] = useState(false);

  useState(() => {
    refetchPending();
    refetchApproved();
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const parseDate = (dateValue: Date | string) => {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;
    const dateStr = String(dateValue);
    if (dateStr.length === 10) return new Date(dateStr + 'T12:00:00');
    return new Date(dateStr);
  };

  const filterAndSort = (titulos: Titulo[]) => {
    let filtered = titulos;
    if (filterObra !== 'all') {
      filtered = filtered.filter((t) => t.obraId === filterObra);
    }
    if (filterToday) {
      filtered = filtered.filter((t) => isToday(parseDate(t.dataVencimento)));
    }
    return [...filtered].sort((a, b) => {
      const dateA = parseDate(a.dataVencimento).getTime();
      const dateB = parseDate(b.dataVencimento).getTime();
      return dateB - dateA;
    });
  };

  const filteredPending = useMemo(() => filterAndSort(pendingTitulos), [pendingTitulos, filterObra, filterToday]);
  const filteredApproved = useMemo(() => filterAndSort(approvedTitulos), [approvedTitulos, filterObra, filterToday]);

  // Obras that appear in either list for the filter
  const obrasInUse = useMemo(() => {
    const ids = new Set([...pendingTitulos, ...approvedTitulos].map((t) => t.obraId));
    return obras.filter((o) => ids.has(o.id));
  }, [obras, pendingTitulos, approvedTitulos]);

  const isLoading = loadingPending || loadingApproved;

  const TituloTable = ({ titulos, showPayButton = false }: { titulos: Titulo[]; showPayButton?: boolean }) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="table-header">
            <th className="text-left p-4">Credor</th>
            <th className="text-left p-4 hidden md:table-cell">Obra</th>
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
              <td className="p-4 hidden md:table-cell">
                <p className="text-sm">{titulo.obraNome}</p>
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
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Centro de Aprovações</h1>
          <p className="text-muted-foreground mt-1">Gerencie aprovações e pagamentos</p>
        </div>

        {/* Tabs + Filters */}
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

            <div className="flex items-center gap-3 sm:ml-auto flex-wrap">
              <div className="flex items-center gap-2">
                <Switch id="filter-today" checked={filterToday} onCheckedChange={setFilterToday} />
                <Label htmlFor="filter-today" className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  Títulos do dia
                </Label>
              </div>

              <Select value={filterObra} onValueChange={setFilterObra}>
                <SelectTrigger className="input-field w-[180px]">
                  <SelectValue placeholder="Todas as obras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as obras</SelectItem>
                  {obrasInUse.map((obra) => (
                    <SelectItem key={obra.id} value={obra.id}>
                      {obra.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <p className="text-muted-foreground">
                  {filterObra !== 'all' ? 'Nenhum título pendente para esta obra.' : 'Todos os títulos foram analisados.'}
                </p>
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
                <p className="text-muted-foreground">
                  {filterObra !== 'all' ? 'Nenhum título aprovado para esta obra.' : 'Todos os títulos aprovados foram pagos.'}
                </p>
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
