import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { TituloCard } from '@/components/titulos/TituloCard';
import { TituloDetailModal } from '@/components/titulos/TituloDetailModal';
import { useTitulosQuery, useTitulosByStatus, useTitulosStats } from '@/hooks/useTitulosQuery';
import { Titulo } from '@/types';
import { useState } from 'react';
import { FileText, Clock, CheckCircle, XCircle, Wallet, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { isLoading } = useTitulosQuery();
  const { data: pendingTitulos = [] } = useTitulosByStatus('enviado');
  const { data: awaitingPayment = [] } = useTitulosByStatus('aprovado');
  const stats = useTitulosStats();
  const navigate = useNavigate();
  const [selectedTitulo, setSelectedTitulo] = useState<Titulo | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

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
      <div className="space-y-6 lg:space-y-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard Financeiro</h1>
          <p className="text-muted-foreground mt-1">Visão geral de todos os títulos</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Total" value={stats.total} icon={<FileText className="h-5 w-5" />} variant="default" />
          <StatCard title="Aguardando" value={stats.enviados} icon={<Clock className="h-5 w-5" />} variant="warning" />
          <StatCard title="Aprovados" value={stats.aprovados} icon={<CheckCircle className="h-5 w-5" />} variant="success" />
          <StatCard title="Reprovados" value={stats.reprovados} icon={<XCircle className="h-5 w-5" />} variant="destructive" />
          <StatCard title="Pagos" value={stats.pagos} icon={<Wallet className="h-5 w-5" />} variant="success" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <StatCard title="Valor Total" value={formatCurrency(stats.valorTotal)} subtitle="Soma de todos os títulos" icon={<TrendingUp className="h-5 w-5" />} variant="default" />
          <StatCard title="Valor Pendente" value={formatCurrency(stats.valorPendente)} subtitle="Aguardando aprovação/pagamento" icon={<AlertCircle className="h-5 w-5" />} variant="default" />
          <StatCard title="Valor Pago" value={formatCurrency(stats.valorPago)} subtitle="Total já quitado" icon={<Wallet className="h-5 w-5" />} variant="default" />
        </div>

        {pendingTitulos.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Aguardando Aprovação</h2>
                <span className="bg-warning/20 text-warning text-xs font-semibold px-2 py-1 rounded-full">{pendingTitulos.length}</span>
              </div>
              <Button variant="ghost" onClick={() => navigate('/admin/aprovacoes')}>Ver todos</Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pendingTitulos.slice(0, 4).map((titulo) => (
                <TituloCard key={titulo.id} titulo={titulo} showObra onClick={() => setSelectedTitulo(titulo)} />
              ))}
            </div>
          </div>
        )}

        {awaitingPayment.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Aguardando Pagamento</h2>
                <span className="bg-success/20 text-success text-xs font-semibold px-2 py-1 rounded-full">{awaitingPayment.length}</span>
              </div>
              <Button variant="ghost" onClick={() => navigate('/admin/titulos')}>Ver todos</Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {awaitingPayment.slice(0, 4).map((titulo) => (
                <TituloCard key={titulo.id} titulo={titulo} showObra onClick={() => setSelectedTitulo(titulo)} />
              ))}
            </div>
          </div>
        )}

        {pendingTitulos.length === 0 && awaitingPayment.length === 0 && (
          <div className="card-elevated p-8 text-center">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tudo em dia!</h3>
            <p className="text-muted-foreground">Não há títulos pendentes de aprovação ou pagamento.</p>
          </div>
        )}
      </div>

      <TituloDetailModal titulo={selectedTitulo} open={!!selectedTitulo} onClose={() => setSelectedTitulo(null)} showActions />
    </AppLayout>
  );
}
