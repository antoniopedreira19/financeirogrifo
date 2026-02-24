import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { TituloCard } from '@/components/titulos/TituloCard';
import { TituloDetailModal } from '@/components/titulos/TituloDetailModal';
import { useAuth } from '@/contexts/AuthContext';
import { useTitulosQuery, useTitulosStats } from '@/hooks/useTitulosQuery';
import { Titulo } from '@/types';
import { useState } from 'react';
import { FileText, Clock, CheckCircle, Wallet, TrendingUp, Plus, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function ObraDashboard() {
  const { selectedObra } = useAuth();
  const { data: titulos = [], isLoading } = useTitulosQuery(selectedObra?.id);
  const stats = useTitulosStats(selectedObra?.id);
  const navigate = useNavigate();
  const [selectedTitulo, setSelectedTitulo] = useState<Titulo | null>(null);

  const recentTitulos = titulos.slice(0, 4);
  
  // Títulos pendentes (aguardando aprovação ou pagamento)
  const pendingTitulos = titulos.filter(t => t.status === 'enviado' || t.status === 'aprovado');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">{selectedObra?.nome} • {selectedObra?.codigo}</p>
          </div>
          <Button variant="gold" onClick={() => navigate('/obra/novo-titulo')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Título
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Total de Títulos" value={stats.total} icon={<FileText className="h-5 w-5" />} variant="default" />
          <StatCard 
            title="Pendentes" 
            value={stats.enviados + stats.aprovados} 
            subtitle="Aguardando aprovação/pagamento"
            icon={<AlertCircle className="h-5 w-5" />} 
            variant="warning" 
            onClick={() => navigate('/obra/titulos?filter=pendente')}
          />
          <StatCard title="Enviados" value={stats.enviados} icon={<Clock className="h-5 w-5" />} variant="warning" />
          <StatCard title="Aprovados" value={stats.aprovados} icon={<CheckCircle className="h-5 w-5" />} variant="success" />
          <StatCard title="Pagos" value={stats.pagos} icon={<Wallet className="h-5 w-5" />} variant="accent" showIcon />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StatCard title="Valor Pendente" value={formatCurrency(stats.valorPendente)} subtitle="Aguardando aprovação ou pagamento" icon={<TrendingUp className="h-5 w-5" style={{ color: '#021C31' }} />} variant="default" />
          <StatCard title="Valor Pago" value={formatCurrency(stats.valorPago)} subtitle="Total já quitado" icon={<Wallet className="h-5 w-5" style={{ color: '#021C31' }} />} variant="default" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Títulos Recentes</h2>
            <Button variant="ghost" onClick={() => navigate('/obra/titulos')}>Ver todos</Button>
          </div>
          
          {recentTitulos.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {recentTitulos.map((titulo) => (
                <TituloCard key={titulo.id} titulo={titulo} onClick={() => setSelectedTitulo(titulo)} />
              ))}
            </div>
          ) : (
            <div className="card-elevated p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum título cadastrado</h3>
              <p className="text-muted-foreground mb-4">Comece cadastrando seu primeiro título financeiro.</p>
              <Button variant="gold" onClick={() => navigate('/obra/novo-titulo')}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Título
              </Button>
            </div>
          )}
        </div>
      </div>

      <TituloDetailModal titulo={selectedTitulo} open={!!selectedTitulo} onClose={() => setSelectedTitulo(null)} />
    </AppLayout>
  );
}
