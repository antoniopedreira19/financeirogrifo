import { Titulo } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { PaymentModal } from "./PaymentModal";
import { SiengeUpdateModal } from "./SiengeUpdateModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useRef } from "react";
import { useUpdateTituloStatus } from "@/hooks/useTitulosQuery";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  CheckCircle,
  XCircle,
  Wallet,
  Building2,
  User,
  Calendar,
  FileText,
  CreditCard,
  Banknote,
  Loader2,
  ExternalLink,
  Copy,
  CopyPlus,
  RefreshCw,
  Upload,
} from "lucide-react";

interface TituloDetailModalProps {
  titulo: Titulo | null;
  open: boolean;
  onClose: () => void;
  showActions?: boolean;
  onReplicate?: (titulo: Titulo) => void;
}

export function TituloDetailModal({ titulo, open, onClose, showActions = false, onReplicate }: TituloDetailModalProps) {
  const updateStatusMutation = useUpdateTituloStatus();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [motivoReprovacao, setMotivoReprovacao] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSiengeModal, setShowSiengeModal] = useState(false);
  const [isUploadingComprovante, setIsUploadingComprovante] = useState(false);
  const comprovanteInputRef = useRef<HTMLInputElement>(null);

  // --- LÓGICA DE TEMPO REAL NO MODAL ---
  // Mantemos isso para caso você reabra o modal, ele já pegue o dado novo
  const { data: tituloFresco } = useQuery({
    queryKey: ["titulo_modal", titulo?.id],
    queryFn: async () => {
      if (!titulo?.id) return null;
      const { data: pendente } = await supabase.from("titulos_pendentes").select("*").eq("id", titulo.id).maybeSingle();

      if (pendente) return pendente;

      const { data: oficial } = await supabase.from("titulos").select("*").eq("id", titulo.id).maybeSingle();

      return oficial;
    },
    enabled: open && !!titulo?.id,
    refetchInterval: 1000,
  });

  if (!titulo) return null;

  const tituloVisualizado = tituloFresco
    ? {
        ...titulo,
        ...tituloFresco,
        idSienge: tituloFresco.id_sienge,
      }
    : titulo;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const parseDate = (dateValue: Date | string) => {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;
    const dateStr = String(dateValue);
    if (dateStr.length === 10) {
      return new Date(dateStr + "T12:00:00");
    }
    return new Date(dateStr);
  };

  // --- MUDANÇA AQUI: FECHA O MODAL IMEDIATAMENTE ---
  const handleAprovar = async () => {
    if (!user?.id) return;

    updateStatusMutation.mutate(
      { id: titulo.id, status: "aprovado", userId: user.id },
      {
        onSuccess: () => {
          onClose(); // <--- FECHA O MODAL AGORA
          toast.success("Aprovado! O ID Sienge aparecerá no card em instantes.");
        },
        onError: () => {
          toast.error("Erro ao aprovar título.");
        },
      },
    );
  };

  const handleReprovar = () => {
    if (!motivoReprovacao.trim() || !user?.id) return;

    updateStatusMutation.mutate(
      { id: titulo.id, status: "reprovado", userId: user.id, motivoReprovacao },
      {
        onSuccess: () => {
          setShowRejectForm(false);
          setMotivoReprovacao("");
          onClose();
        },
      },
    );
  };

  const handlePagar = (obs: string) => {
    if (!user?.id) return;

    updateStatusMutation.mutate(
      { id: titulo.id, status: "pago", userId: user.id, obs },
      {
        onSuccess: () => {
          setShowPaymentModal(false);
          onClose();
        },
      },
    );
  };

  const planoFinanceiroLabels = {
    servicos_terceiros: "Serviços de Terceiros",
    materiais_aplicados: "Materiais Aplicados",
  };

  const tipoDocumentoLabels: Record<string, string> = {
    nota_fiscal: "Nota Fiscal",
    boleto: "Boleto",
    recibo: "Recibo",
    contrato: "Contrato",
    outros: "Outros",
    outro: "Outros",
  };

  const isLoading = updateStatusMutation.isPending;

  const handleComprovanteUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id || !tituloVisualizado) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato não suportado. Use PDF, JPEG ou PNG.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB.");
      return;
    }

    setIsUploadingComprovante(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `comprovante_${tituloVisualizado.id}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("titulo-documentos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Erro ao enviar comprovante.");
        return;
      }

      const { error: updateError } = await supabase
        .from("titulos")
        .update({ documento_url: filePath })
        .eq("id", tituloVisualizado.id);

      if (updateError) {
        console.error("Update error:", updateError);
        toast.error("Erro ao salvar comprovante.");
        return;
      }

      const { data: publicUrlData } = supabase.storage.from("titulo-documentos").getPublicUrl(filePath);

      try {
        await fetch("https://grifoworkspace.app.n8n.cloud/webhook/comprovante-importado", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documento_url: publicUrlData.publicUrl,
            obra_codigo: tituloVisualizado.obraCodigo,
            tipo_documento: tituloVisualizado.tipoDocumentoFiscal,
            sienge_id: tituloVisualizado.idSienge,
            data_emissao: tituloVisualizado.dataEmissao,
            descricao: tituloVisualizado.descricao || null,
          }),
        });
      } catch (webhookError) {
        console.error("Webhook error:", webhookError);
      }

      toast.success("Comprovante importado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["titulos"] });
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao importar comprovante.");
    } finally {
      setIsUploadingComprovante(false);
      if (comprovanteInputRef.current) {
        comprovanteInputRef.current.value = "";
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-xl">{tituloVisualizado.credor}</DialogTitle>
            <div className="flex items-center gap-3">
              {(tituloVisualizado.status === "aprovado" || tituloVisualizado.status === "pago") &&
                tituloVisualizado.idSienge && (
                  <div className="flex flex-col items-end border-r pr-3">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                      ID Sienge
                    </span>
                    <span className="text-lg font-mono font-bold text-emerald-600 leading-none">
                      {tituloVisualizado.idSienge}
                    </span>
                  </div>
                )}
              <StatusBadge status={tituloVisualizado.status} />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <input
            type="file"
            ref={comprovanteInputRef}
            onChange={handleComprovanteUpload}
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
          />

          <div className="flex gap-2">
            {tituloVisualizado.idSienge && (
              <Button variant="outline" className="flex-1 gap-2" onClick={() => setShowSiengeModal(true)}>
                <RefreshCw className="h-4 w-4" />
                Atualizar no Sienge
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => comprovanteInputRef.current?.click()}
              disabled={isUploadingComprovante}
            >
              {isUploadingComprovante ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Importar Comprovante
            </Button>
          </div>

          <div className="bg-accent/10 rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
            <p className="text-3xl font-bold text-accent">{formatCurrency(tituloVisualizado.valorTotal)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {tituloVisualizado.parcelas}x de{" "}
              {formatCurrency(tituloVisualizado.valorTotal / tituloVisualizado.parcelas)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem icon={Building2} label="Obra" value={tituloVisualizado.obraNome || "-"} />
            <InfoItem icon={User} label="Credor" value={tituloVisualizado.credor} />
            <InfoItem
              icon={FileText}
              label={tituloVisualizado.tipoDocumento.toUpperCase()}
              value={tituloVisualizado.documento}
            />
            <InfoItem icon={FileText} label="Nº Documento" value={tituloVisualizado.numeroDocumento} />
            <InfoItem
              icon={Calendar}
              label="Emissão"
              value={format(parseDate(tituloVisualizado.dataEmissao), "dd/MM/yyyy", { locale: ptBR })}
            />
            <InfoItem
              icon={Calendar}
              label="Vencimento"
              value={format(parseDate(tituloVisualizado.dataVencimento), "dd/MM/yyyy", { locale: ptBR })}
            />
            <InfoItem icon={CreditCard} label="Centro de Custo" value={tituloVisualizado.centroCusto} />
            <InfoItem
              icon={Banknote}
              label="Plano Financeiro"
              value={planoFinanceiroLabels[tituloVisualizado.planoFinanceiro]}
            />
            {tituloVisualizado.idSienge && (
              <InfoItem icon={RefreshCw} label="ID Sienge" value={tituloVisualizado.idSienge.toString()} />
            )}
          </div>

          {tituloVisualizado.descricao && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Descrição</p>
              <p className="text-foreground">{tituloVisualizado.descricao}</p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Etapa Apropriada</p>
            <p className="text-foreground">{tituloVisualizado.etapaApropriada}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Tipo de Documento</p>
            <p className="text-foreground">
              {tipoDocumentoLabels[tituloVisualizado.tipoDocumentoFiscal] || tituloVisualizado.tipoDocumentoFiscal}
            </p>
          </div>

          {tituloVisualizado.documentoUrl && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Documento Anexo</p>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => {
                  const { data } = supabase.storage
                    .from("titulo-documentos")
                    .getPublicUrl(tituloVisualizado.documentoUrl!);
                  window.open(data.publicUrl, "_blank");
                }}
              >
                <ExternalLink className="h-4 w-4" />
                Baixar/Visualizar Documento Anexo
              </Button>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Dados de Pagamento</p>
            {tituloVisualizado.tipoLeituraPagamento && (
              <div className="text-xs text-muted-foreground">
                Tipo:{" "}
                {tituloVisualizado.tipoLeituraPagamento === "manual"
                  ? "Manual"
                  : tituloVisualizado.tipoLeituraPagamento === "boleto"
                    ? "Boleto"
                    : "QR Code / Pix"}
              </div>
            )}

            {tituloVisualizado.arquivoPagamentoUrl && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => {
                  const { data } = supabase.storage
                    .from("titulo-documentos")
                    .getPublicUrl(tituloVisualizado.arquivoPagamentoUrl!);
                  window.open(data.publicUrl, "_blank");
                }}
              >
                <ExternalLink className="h-4 w-4" />
                Visualizar Arquivo Original
              </Button>
            )}

            {tituloVisualizado.dadosBancarios && tituloVisualizado.dadosBancarios.trim() && (
              <div className="space-y-2">
                <div className="bg-muted/50 rounded-lg p-3 font-mono text-sm break-all">
                  {tituloVisualizado.dadosBancarios}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(tituloVisualizado.dadosBancarios);
                    toast.success("Código copiado para a área de transferência");
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Copiar Código
                </Button>
              </div>
            )}

            {!tituloVisualizado.arquivoPagamentoUrl &&
              (!tituloVisualizado.dadosBancarios || !tituloVisualizado.dadosBancarios.trim()) && (
                <p className="text-sm text-muted-foreground italic">Nenhum dado de pagamento informado</p>
              )}
          </div>

          {tituloVisualizado.motivoReprovacao && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-destructive">Motivo da Reprovação</p>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-foreground">{tituloVisualizado.motivoReprovacao}</p>
              </div>
            </div>
          )}

          {onReplicate && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  onReplicate(tituloVisualizado);
                  onClose();
                }}
              >
                <CopyPlus className="h-4 w-4" />
                Replicar Título
              </Button>
            </div>
          )}

          {showActions && (
            <>
              {tituloVisualizado.status === "enviado" && !showRejectForm && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="gold" className="flex-1" onClick={handleAprovar} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Aprovar
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setShowRejectForm(true)}
                    disabled={isLoading}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reprovar
                  </Button>
                </div>
              )}

              {showRejectForm && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="motivo">Motivo da Reprovação</Label>
                    <Textarea
                      id="motivo"
                      value={motivoReprovacao}
                      onChange={(e) => setMotivoReprovacao(e.target.value)}
                      placeholder="Descreva o motivo da reprovação..."
                      rows={3}
                      className="input-field"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowRejectForm(false);
                        setMotivoReprovacao("");
                      }}
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={handleReprovar}
                      disabled={isLoading || !motivoReprovacao.trim()}
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Confirmar Reprovação
                    </Button>
                  </div>
                </div>
              )}

              {tituloVisualizado.status === "aprovado" && (
                <div className="pt-4 border-t">
                  <Button
                    variant="success"
                    className="w-full"
                    onClick={() => setShowPaymentModal(true)}
                    disabled={isLoading}
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Registrar Pagamento
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>

      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handlePagar}
        isLoading={isLoading}
        credorName={tituloVisualizado.credor}
        valorTotal={tituloVisualizado.valorTotal}
      />

      {tituloVisualizado.idSienge && (
        <SiengeUpdateModal
          tituloId={tituloVisualizado.id}
          open={showSiengeModal}
          onClose={() => setShowSiengeModal(false)}
          idSienge={tituloVisualizado.idSienge}
          tipoDocumento={tituloVisualizado.tipoDocumentoFiscal}
          numeroDocumento={tituloVisualizado.numeroDocumento}
          status={tituloVisualizado.status}
        />
      )}
    </Dialog>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
