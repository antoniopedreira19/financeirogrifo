import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TituloCard } from "@/components/titulos/TituloCard";
import { TituloDetailModal } from "@/components/titulos/TituloDetailModal";
import { useAuth } from "@/contexts/AuthContext";
import { useTitulosQuery } from "@/hooks/useTitulosQuery";
import { Titulo, TituloStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FileText, Loader2, X } from "lucide-react"; // Adicionei o X
import { useNavigate } from "react-router-dom";

export default function ObraTitulos() {
  const { selectedObra } = useAuth();
  const { data: titulos = [], isLoading } = useTitulosQuery(selectedObra?.id);
  const navigate = useNavigate();
  const [selectedTitulo, setSelectedTitulo] = useState<Titulo | null>(null);

  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TituloStatus | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredTitulos = titulos.filter((titulo) => {
    // 1. Filtro de Texto
    const matchesSearch =
      titulo.credor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      titulo.numeroDocumento.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Filtro de Status
    const matchesStatus = statusFilter === "all" || titulo.status === statusFilter;

    // 3. Filtro de Data
    let matchesDate = true;
    if (startDate || endDate) {
      const tituloDate = new Date(titulo.dataVencimento); // Confirme se o campo é dataVencimento

      if (startDate) {
        const start = new Date(startDate);
        if (tituloDate < start) matchesDate = false;
      }

      if (endDate && matchesDate) {
        const end = new Date(endDate);
        if (tituloDate > end) matchesDate = false;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters = searchTerm || statusFilter !== "all" || startDate || endDate;

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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Meus Títulos</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground">{filteredTitulos.length} título(s) encontrado(s)</p>
              {/* Botão de limpar filtros */}
              {hasActiveFilters && (
                <Button variant="link" size="sm" onClick={clearFilters} className="text-red-500 h-auto p-0 ml-2">
                  <X className="h-3 w-3 mr-1" /> Limpar filtros
                </Button>
              )}
            </div>
          </div>
          <Button variant="gold" onClick={() => navigate("/obra/novo-titulo")}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Título
          </Button>
        </div>

        {/* Filters Area - Layout Grid com Labels */}
        <div className="card-elevated p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
            {/* 1. Busca (Ocupa 6 colunas) */}
            <div className="lg:col-span-6 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por credor ou número do documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input-field w-full"
                />
              </div>
            </div>

            {/* 2. Status (Ocupa 2 colunas) */}
            <div className="lg:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Status</label>
              <Select value={statusFilter} onValueChange={(value: TituloStatus | "all") => setStatusFilter(value)}>
                <SelectTrigger className="w-full input-field">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="reprovado">Reprovado</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 3. Data Inicial (Ocupa 2 colunas) */}
            <div className="lg:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Data Inicial</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field w-full"
              />
            </div>

            {/* 4. Data Final (Ocupa 2 colunas) */}
            <div className="lg:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Data Final</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field w-full"
              />
            </div>
          </div>
        </div>

        {/* Titles List */}
        {filteredTitulos.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTitulos.map((titulo) => (
              <TituloCard key={titulo.id} titulo={titulo} onClick={() => setSelectedTitulo(titulo)} />
            ))}
          </div>
        ) : (
          <div className="card-elevated p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {hasActiveFilters ? "Nenhum título encontrado" : "Nenhum título cadastrado"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters
                ? "Tente ajustar os filtros de busca."
                : "Comece cadastrando seu primeiro título financeiro."}
            </p>
            {!hasActiveFilters && (
              <Button variant="gold" onClick={() => navigate("/obra/novo-titulo")}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Título
              </Button>
            )}
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-2 text-primary">
                Limpar filtros
              </Button>
            )}
          </div>
        )}
      </div>

      <TituloDetailModal titulo={selectedTitulo} open={!!selectedTitulo} onClose={() => setSelectedTitulo(null)} />
    </AppLayout>
  );
}
