import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TituloDetailModal } from '@/components/titulos/TituloDetailModal';
import { StatusBadge } from '@/components/titulos/StatusBadge';
import { useTitulosByStatus } from '@/hooks/useTitulosQuery';
import { Titulo } from '@/types';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, CheckCircle, Clock, Wallet, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminAprovacoes() {
  const { data: pendingTitulos = [], isLoading: loadingPending, refetch: refetchPending } = useTitulosByStatus('enviado');
  const { data: approvedTitulos = [], isLoading: loadingApproved, refetch: refetchApproved } = useTitulosByStatus('aprovado');
  const [selectedTitulo, setSelectedTitulo] = useState<Titulo | null>(null);

  // Refetch data when component mounts to ensure fresh data
  useState(() => {
    refetchPending();
    refetchApproved();
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const isLoading = loadingPending || loadingApproved;

  const TituloTable = ({ titulos, showPayButton = false }: { titulos: Titulo[]; showPayButton?: boolean }) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="table-header">
            <th className="text-left p-4">Credor</th>
            <th className="text-left p-4 hidden md:table-cell">Obra</th>
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
                <p className="text-sm">
                  {format(new Date(titulo.dataVencimento), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </td>
              <td className="p-4 text-right">
                <p className="font-semibold text-accent">{formatCurrency(titulo.valorTotal)}</p>
              </td>
              <td className="p-4 text-center">
                <StatusBadge status={titulo.status} size="sm" />
              </td>
              <td className="p-4 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTitulo(titulo)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {showPayButton ? 'Pagar' : 'Analisar'}
                </Button>
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
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Centro de Aprovações
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie aprovações e pagamentos
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Aguardando
              {pendingTitulos.length > 0 && (
                <span className="bg-warning/20 text-warning text-xs font-semibold px-2 py-0.5 rounded-full">
                  {pendingTitulos.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Pagar
              {approvedTitulos.length > 0 && (
                <span className="bg-success/20 text-success text-xs font-semibold px-2 py-0.5 rounded-full">
                  {approvedTitulos.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingTitulos.length > 0 ? (
              <div className="card-elevated overflow-hidden">
                <TituloTable titulos={pendingTitulos} />
              </div>
            ) : (
              <div className="card-elevated p-8 text-center">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum título pendente</h3>
                <p className="text-muted-foreground">
                  Todos os títulos foram analisados.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            {approvedTitulos.length > 0 ? (
              <div className="card-elevated overflow-hidden">
                <TituloTable titulos={approvedTitulos} showPayButton />
              </div>
            ) : (
              <div className="card-elevated p-8 text-center">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum pagamento pendente</h3>
                <p className="text-muted-foreground">
                  Todos os títulos aprovados foram pagos.
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
