import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TituloCard } from "@/components/titulos/TituloCard";
import { TituloDetailModal } from "@/components/titulos/TituloDetailModal";
import { useAuth } from "@/contexts/AuthContext";
import { useTitulosQuery } from "@/hooks/useTitulosQuery";
import { Titulo, TituloStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Plus, Search, FileText, Loader2, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

type StatusFilterType = TituloStatus | "all" | "pendente";

const ITEMS_PER_PAGE = 20;

export default function ObraTitulos() {
  const { selectedObra } = useAuth();
  const { data: titulos = [], isLoading } = useTitulosQuery(selectedObra?.id);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTitulo, setSelectedTitulo] = useState<Titulo | null>(null);

  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [adFilter, setAdFilter] = useState<"all" | "ad">("all");
  const [anexoFilter, setAnexoFilter] = useState<"all" | "with" | "without">("all");

  // Estado da Paginação
  const [currentPage, setCurrentPage] = useState(1);

  // Inicializar filtro a partir da URL
  useEffect(() => {
    const filterParam = searchParams.get("filter");
    if (filterParam === "pendente") {
      setStatusFilter("pendente");
    }
  }, [searchParams]);

  // Resetar para página 1 quando qualquer filtro mudar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, startDate, endDate, adFilter, anexoFilter]);

  const filteredTitulos = titulos.filter((titulo) => {
    // 1. Filtro de Texto
    const searchLower = searchTerm.toLowerCase();
    const valorFormatted = titulo.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const matchesSearch =
      titulo.credor.toLowerCase().includes(searchLower) ||
      titulo.numeroDocumento.toLowerCase().includes(searchLower) ||
      titulo.valorTotal.toString().includes(searchTerm) ||
      valorFormatted.includes(searchTerm);

    // 2. Filtro de Status
    let matchesStatus = true;
    if (statusFilter === "pendente") {
      matchesStatus = titulo.status === "enviado" || titulo.status === "aprovado";
    } else if (statusFilter !== "all") {
      matchesStatus = titulo.status === statusFilter;
    }

    // 3. Filtro de Data
    let matchesDate = true;
    if (startDate || endDate) {
      const tituloDate = new Date(titulo.dataVencimento);

      if (startDate) {
        const start = new Date(startDate);
        if (tituloDate < start) matchesDate = false;
      }

      if (endDate && matchesDate) {
        const end = new Date(endDate);
        if (tituloDate > end) matchesDate = false;
      }
    }

    // 4. Filtro AD
    const matchesAd = adFilter === "all" || titulo.numeroDocumento.toUpperCase().includes("AD");

    // 5. Filtro de Anexo
    const matchesAnexo =
      anexoFilter === "all" ? true : anexoFilter === "with" ? !!titulo.documentoUrl : !titulo.documentoUrl;

    return matchesSearch && matchesStatus && matchesDate && matchesAd && matchesAnexo;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setAdFilter("all");
    setAnexoFilter("all");
    setSearchParams({});
    setCurrentPage(1);
  };

  // Lógica de Paginação
  const totalPages = Math.ceil(filteredTitulos.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTitulos = filteredTitulos.slice(startIndex, endIndex);

  const hasActiveFilters =
    searchTerm || statusFilter !== "all" || startDate || endDate || adFilter !== "all" || anexoFilter !== "all";

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
              <p className="text-muted-foreground">
                Mostrando {currentTitulos.length} de {filteredTitulos.length} título(s)
              </p>
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

        {/* Filtros */}
        <div className="card-elevated p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
            {/* Busca */}
            <div className="lg:col-span-3 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por credor ou doc..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input-field w-full"
                />
              </div>
            </div>

            {/* Status */}
            <div className="lg:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Status</label>
              <Select value={statusFilter} onValueChange={(value: StatusFilterType) => setStatusFilter(value)}>
                <SelectTrigger className="w-full input-field">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="reprovado">Reprovado</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo */}
            <div className="lg:col-span-1 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Tipo</label>
              <Select value={adFilter} onValueChange={(value: "all" | "ad") => setAdFilter(value)}>
                <SelectTrigger className="w-full input-field">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ad">AD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Anexo */}
            <div className="lg:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Anexo</label>
              <Select value={anexoFilter} onValueChange={(value: "all" | "with" | "without") => setAnexoFilter(value)}>
                <SelectTrigger className="w-full input-field">
                  <SelectValue placeholder="Anexo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="with">Com Anexo</SelectItem>
                  <SelectItem value="without">Sem Anexo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Datas */}
            <div className="lg:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Data Inicial</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field w-full"
              />
            </div>
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

        {/* Lista de Títulos Paginada */}
        {filteredTitulos.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {currentTitulos.map((titulo) => (
                <TituloCard key={titulo.id} titulo={titulo} onClick={() => setSelectedTitulo(titulo)} />
              ))}
            </div>

            {/* Componente de Paginação */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {/* Lógica simples de exibição de números */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Mostrar primeira, última, atual e vizinhas
                      if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              isActive={page === currentPage}
                              onClick={() => setCurrentPage(page)}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
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

      <TituloDetailModal
        titulo={selectedTitulo}
        open={!!selectedTitulo}
        onClose={() => setSelectedTitulo(null)}
        onReplicate={(titulo) => navigate("/obra/novo-titulo", { state: { tituloToReplicate: titulo } })}
      />
    </AppLayout>
  );
}
