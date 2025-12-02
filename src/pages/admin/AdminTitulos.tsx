import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TituloCard } from "@/components/titulos/TituloCard";
import { TituloDetailModal } from "@/components/titulos/TituloDetailModal";
import { useTitulosQuery } from "@/hooks/useTitulosQuery";
import { useObrasQuery } from "@/hooks/useObrasQuery";
import { Titulo, TituloStatus } from "@/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Loader2, Plus, X } from "lucide-react"; // Adicionei o ícone X
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function AdminTitulos() {
  const navigate = useNavigate();
  const { data: titulos = [], isLoading: loadingTitulos } = useTitulosQuery();
  const { data: obras = [], isLoading: loadingObras } = useObrasQuery();
  const [selectedTitulo, setSelectedTitulo] = useState<Titulo | null>(null);

  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TituloStatus | "all">("all");
  const [obraFilter, setObraFilter] = useState<string>("all");

  // NOVOS ESTADOS PARA DATA
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredTitulos = titulos.filter((titulo) => {
    // 1. Filtro de Texto
    const matchesSearch =
      titulo.credor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      titulo.numeroDocumento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      titulo.obraNome?.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Filtro de Status
    const matchesStatus = statusFilter === "all" || titulo.status === statusFilter;

    // 3. Filtro de Obra
    const matchesObra = obraFilter === "all" || titulo.obraId === obraFilter;

    // 4. NOVO: Filtro de Data (Considerando Data de Vencimento)
    // IMPORTANTE: Verifique se no seu objeto 'titulo' o campo é 'dataVencimento' ou 'data_vencimento'
    let matchesDate = true;
    if (startDate || endDate) {
      const tituloDate = new Date(titulo.dataVencimento); // Ajuste o campo aqui se necessário

      if (startDate) {
        const start = new Date(startDate);
        if (tituloDate < start) matchesDate = false;
      }

      if (endDate && matchesDate) {
        const end = new Date(endDate);
        if (tituloDate > end) matchesDate = false;
      }
    }

    return matchesSearch && matchesStatus && matchesObra && matchesDate;
  });

  // Função para limpar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setObraFilter("all");
    setStartDate("");
    setEndDate("");
  };

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Todos os Títulos</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground">{filteredTitulos.length} título(s) encontrado(s)</p>
              {/* Botão de limpar filtros se houver algum ativo */}
              {(searchTerm || statusFilter !== "all" || obraFilter !== "all" || startDate || endDate) && (
                <Button variant="link" size="sm" onClick={clearFilters} className="text-red-500 h-auto p-0 ml-2">
                  <X className="h-3 w-3 mr-1" /> Limpar filtros
                </Button>
              )}
            </div>
          </div>
          <Button variant="gold" onClick={() => navigate("/admin/novo-titulo")}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Título
          </Button>
        </div>

        {/* Filters Area */}
        <div className="card-elevated p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
            {/* Campo de Busca (Ocupa 4 colunas) */}
            <div className="lg:col-span-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por credor, doc ou obra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-field w-full"
              />
            </div>

            {/* Filtro de Obra (Ocupa 2 colunas) */}
            <div className="lg:col-span-2">
              <Select value={obraFilter} onValueChange={setObraFilter}>
                <SelectTrigger className="w-full input-field">
                  <SelectValue placeholder="Obra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Obras</SelectItem>
                  {obras.map((obra) => (
                    <SelectItem key={obra.id} value={obra.id}>
                      {obra.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Status (Ocupa 2 colunas) */}
            <div className="lg:col-span-2">
              <Select value={statusFilter} onValueChange={(value: TituloStatus | "all") => setStatusFilter(value)}>
                <SelectTrigger className="w-full input-field">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="reprovado">Reprovado</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* NOVO: Filtro de Datas (Ocupa 4 colunas divididas em 2 inputs) */}
            <div className="lg:col-span-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field w-full"
                title="Data Inicial"
              />
            </div>
            <div className="lg:col-span-2">
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field w-full"
                title="Data Final"
              />
            </div>
          </div>
        </div>

        {/* Titles List */}
        {filteredTitulos.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTitulos.map((titulo) => (
              <TituloCard key={titulo.id} titulo={titulo} showObra onClick={() => setSelectedTitulo(titulo)} />
            ))}
          </div>
        ) : (
          <div className="card-elevated p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum título encontrado</h3>
            <p className="text-muted-foreground">Tente ajustar os filtros de busca.</p>
            <Button variant="link" onClick={clearFilters} className="mt-2 text-primary">
              Limpar todos os filtros
            </Button>
          </div>
        )}
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
