import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { StatusPieChart } from "@/components/dashboard/StatusPieChart";
import { AlcadaBarChart } from "@/components/dashboard/AlcadaBarChart";
import { MonthlyEvolutionChart } from "@/components/dashboard/MonthlyEvolutionChart";
import { ApproverRankingTable } from "@/components/dashboard/ApproverRankingTable";
import { ObraBreakdownChart } from "@/components/dashboard/ObraBreakdownChart";
import { TituloDetailModal } from "@/components/titulos/TituloDetailModal";
import { useTitulosQuery } from "@/hooks/useTitulosQuery";
import { useObrasQuery } from "@/hooks/useObrasQuery";
import { Titulo } from "@/types";
import { useState, useMemo, useEffect } from "react";
import { FileText, Clock, CheckCircle, XCircle, Wallet, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export default function AdminDashboard() {
  
  const { data: allTitulos = [], isLoading: loadingTitulos } = useTitulosQuery();
  const { data: obras = [], isLoading: loadingObras } = useObrasQuery();

  const [selectedTitulo, setSelectedTitulo] = useState<Titulo | null>(null);
  const [obraFilter, setObraFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [users, setUsers] = useState<{ id: string; nome: string }[]>([]);

  // Fetch users who created titulos
  const creatorIds = useMemo(() => {
    const ids = new Set<string>();
    allTitulos.forEach((t) => { if (t.criadoPor) ids.add(t.criadoPor); });
    return Array.from(ids);
  }, [allTitulos]);

  useEffect(() => {
    if (creatorIds.length === 0) return;
    supabase
      .from('profiles')
      .select('id, nome')
      .in('id', creatorIds)
      .order('nome')
      .then(({ data }) => {
        if (data) setUsers(data);
      });
  }, [creatorIds]);

  const filteredTitulos = useMemo(() => {
    let result = allTitulos;
    if (obraFilter !== "all") result = result.filter((t) => t.obraId === obraFilter);
    if (userFilter !== "all") result = result.filter((t) => t.criadoPor === userFilter);
    return result;
  }, [allTitulos, obraFilter, userFilter]);

  const stats = useMemo(() => ({
    total: filteredTitulos.length,
    enviados: filteredTitulos.filter((t) => t.status === "enviado").length,
    aprovados: filteredTitulos.filter((t) => t.status === "aprovado").length,
    reprovados: filteredTitulos.filter((t) => t.status === "reprovado").length,
    pagos: filteredTitulos.filter((t) => t.status === "pago").length,
    valorTotal: filteredTitulos.reduce((acc, t) => acc + Number(t.valorTotal), 0),
    valorAguardandoAprovacao: filteredTitulos
      .filter((t) => t.status === "enviado")
      .reduce((acc, t) => acc + Number(t.valorTotal), 0),
    valorAguardandoPagamento: filteredTitulos
      .filter((t) => t.status === "aprovado")
      .reduce((acc, t) => acc + Number(t.valorTotal), 0),
    valorPago: filteredTitulos.filter((t) => t.status === "pago").reduce((acc, t) => acc + Number(t.valorTotal), 0),
  }), [filteredTitulos]);

  
  

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const isLoading = loadingTitulos || loadingObras;

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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard Financeiro</h1>
            <p className="text-muted-foreground mt-1">Visão geral de todos os títulos</p>
          </div>
          <div className="w-full md:w-[250px]">
            <Select value={obraFilter} onValueChange={setObraFilter}>
              <SelectTrigger className="w-full input-field">
                <SelectValue placeholder="Filtrar por Obra" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Obras</SelectItem>
                {obras.map((obra) => (
                  <SelectItem key={obra.id} value={obra.id}>
                    {obra.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cards de Quantidade */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Total" value={stats.total} icon={<FileText className="h-5 w-5" />} variant="default" />
          <StatCard title="Aguardando" value={stats.enviados} icon={<Clock className="h-5 w-5" />} variant="warning" />
          <StatCard title="Aprovados" value={stats.aprovados} icon={<CheckCircle className="h-5 w-5" />} variant="success" />
          <StatCard title="Reprovados" value={stats.reprovados} icon={<XCircle className="h-5 w-5" />} variant="destructive" />
          <StatCard title="Pagos" value={stats.pagos} icon={<Wallet className="h-5 w-5" />} variant="success" />
        </div>

        {/* Cards Financeiros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Valor Total"
            value={formatCurrency(stats.valorTotal)}
            subtitle="Soma dos títulos filtrados"
            icon={<TrendingUp className="h-5 w-5" />}
            variant="default"
          />
          <StatCard
            title="Aguardando Aprovação"
            value={formatCurrency(stats.valorAguardandoAprovacao)}
            subtitle="Títulos enviados"
            icon={<Clock className="h-5 w-5" />}
            variant="default"
          />
          <StatCard
            title="Aguardando Pagamento"
            value={formatCurrency(stats.valorAguardandoPagamento)}
            subtitle="Títulos aprovados"
            icon={<AlertCircle className="h-5 w-5" />}
            variant="default"
          />
          <StatCard
            title="Valor Pago"
            value={formatCurrency(stats.valorPago)}
            subtitle="Total já quitado"
            icon={<Wallet className="h-5 w-5" />}
            variant="default"
          />
        </div>

        {/* KPIs Operacionais */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Indicadores Operacionais</h2>
          <KpiCards titulos={filteredTitulos} />
        </div>

        {/* Gráficos - Linha 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatusPieChart titulos={filteredTitulos} />
          <AlcadaBarChart titulos={filteredTitulos} />
        </div>

        {/* Gráfico Evolução Mensal */}
        <MonthlyEvolutionChart titulos={filteredTitulos} />

        {/* Gráficos - Linha 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ObraBreakdownChart titulos={filteredTitulos} />
          <ApproverRankingTable titulos={filteredTitulos} />
        </div>

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
