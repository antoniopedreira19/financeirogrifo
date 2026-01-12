import { Titulo } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2, Calendar, CreditCard, User } from "lucide-react";

interface TituloCardProps {
  titulo: Titulo;
  onClick?: () => void;
  showObra?: boolean;
}

export function TituloCard({ titulo, onClick, showObra = false }: TituloCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Helper to parse date strings safely (handles both "YYYY-MM-DD" and full timestamps)
  const parseDate = (dateValue: Date | string) => {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;
    const dateStr = String(dateValue);
    // If it's just a date (10 chars like "2026-01-09"), add time to avoid timezone issues
    if (dateStr.length === 10) {
      return new Date(dateStr + "T12:00:00");
    }
    return new Date(dateStr);
  };

  return (
    <div
      onClick={onClick}
      className="card-elevated p-4 lg:p-5 hover:shadow-lg transition-all duration-200 cursor-pointer animate-slide-up"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{titulo.credor}</h3>
          <p className="text-sm text-muted-foreground">{titulo.numeroDocumento}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* MUDANÇA AQUI: Exibe se for aprovado OU pago */}
          {(titulo.status === "aprovado" || titulo.status === "pago") && titulo.idSienge && (
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
              Sienge #{titulo.idSienge}
            </Badge>
          )}
          <StatusBadge status={titulo.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {showObra && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span className="truncate">{titulo.obraNome}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4" />
          <span className="truncate">{titulo.criadoPorNome}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{format(parseDate(titulo.dataVencimento), "dd/MM/yyyy", { locale: ptBR })}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <CreditCard className="h-4 w-4" />
          <span>{titulo.parcelas}x</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{titulo.etapaApropriada}</span>
        <span className="text-lg font-bold text-accent">{formatCurrency(titulo.valorTotal)}</span>
      </div>
    </div>
  );
}
