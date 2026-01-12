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
import { useQueryClient } from "@tanstack/react-query";
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
  const [isApprovingToSienge, setIsApprovingToSienge] = useState(false);
  const comprovanteInputRef = useRef<HTMLInputElement>(null);

  if (!titulo) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Helper to parse date strings safely (handles both "YYYY-MM-DD" and full timestamps)
  const parseDate = (dateValue: Date | string) => {
    if (!dateValue) return new Date();
    // If it's already a Date object, return it
    if (dateValue instanceof Date) return dateValue;
    // If it's just a date string (10 chars like "2026-01-09"), add time to avoid timezone issues
    const dateStr = String(dateValue);
    if (dateStr.length === 10) {
      return new Date(dateStr + "T12:00:00");
    }
    // Otherwise parse the full timestamp
    return new Date(dateStr);
  };

  const handleAprovar = async () => {
    if (!user?.id) return;

    setIsApprovingToSienge(true);
    try {
      // Call webhook to send titulo to Sienge and get id_sienge
      const webhookPayload = {
        id: titulo.id,
        empresa: titulo.empresa,
        credor: titulo.credor,
        documento_tipo: titulo.tipoDocumento,
        documento_numero: titulo.documento,
        obra_codigo: titulo.obraCodigo,
        centro_custo: titulo.centroCusto,
        etapa: titulo.etapaApropriada,
        codigo_etapa: titulo.codigoEtapa,
        valor_total: titulo.valorTotal,
        descontos: titulo.descontos,
        parcelas: titulo.parcelas,
        tipo_documento: titulo.tipoDocumentoFiscal,
        numero_documento: titulo.numeroDocumento,
        data_emissao: titulo.dataEmissao,
        data_vencimento: titulo.dataVencimento,
        plano_financeiro: titulo.planoFinanceiro,
        dados_bancarios: titulo.dadosBancarios,
        documento_url: titulo.documentoUrl,
        descricao: titulo.descricao,
      };

      const webhookResponse = await fetch("https://grifoworkspace.app.n8n.cloud/webhook/titulos-sienge-pendentes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!webhookResponse.ok) {
        throw new Error("Erro ao enviar para o Sienge");
      }

      const responseData = await webhookResponse.json();
      const idSienge = responseData.id_sienge;

      // Update status with id_sienge
      updateStatusMutation.mutate(
        { id: titulo.id, status: "aprovado", userId: user.id, idSienge },
        {
          onSuccess: () => {
            setIsApprovingToSienge(false);
            onClose();
          },
          onError: () => {
            setIsApprovingToSienge(false);
          },
        },
      );
    } catch (error) {
      console.error("Error calling Sienge webhook:", error);
      toast.error("Erro ao enviar para o Sienge. Tente novamente.");
      setIsApprovingToSienge(false);
    }
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

  const isLoading = updateStatusMutation.isPending || isApprovingToSienge;

  const handleComprovanteUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id || !titulo) return;

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
      const fileName = `comprovante_${titulo.id}.${fileExt}`;
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
        .eq("id", titulo.id);

      if (updateError) {
        console.error("Update error:", updateError);
        toast.error("Erro ao salvar comprovante.");
        return;
      }

      // Get public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage.from("titulo-documentos").getPublicUrl(filePath);

      // Send webhook with titulo data
      try {
        await fetch("https://grifoworkspace.app.n8n.cloud/webhook/comprovante-importado", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documento_url: publicUrlData.publicUrl,
            obra_codigo: titulo.obraCodigo,
            tipo_documento: titulo.tipoDocumentoFiscal,
            sienge_id: titulo.idSienge,
            data_emissao: titulo.dataEmissao,
            descricao: titulo.descricao || null,
          }),
        });
      } catch (webhookError) {
        console.error("Webhook error:", webhookError);
        // Don't show error to user since upload was successful
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
            <DialogTitle className="text-xl">{titulo.credor}</DialogTitle>
            <div className="flex items-center gap-3">
              {/* --- CÓDIGO NOVO: Destaque do ID Sienge --- */}
              {(titulo.status === "aprovado" || titulo.status === "pago") && titulo.idSienge && (
                <div className="flex flex-col items-end border-r pr-3">
                  <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                    ID Sienge
                  </span>
                  <span className="text-lg font-mono font-bold text-emerald-600 leading-none">{titulo.idSienge}</span>
                </div>
              )}
              <StatusBadge status={titulo.status} />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Hidden file input for comprovante */}
          <input
            type="file"
            ref={comprovanteInputRef}
            onChange={handleComprovanteUpload}
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
          />

          {/* Botões de ação no topo */}
          <div className="flex gap-2">
            {titulo.idSienge && (
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

          {/* Valor destacado */}
          <div className="bg-accent/10 rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
            <p className="text-3xl font-bold text-accent">{formatCurrency(titulo.valorTotal)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {titulo.parcelas}x de {formatCurrency(titulo.valorTotal / titulo.parcelas)}
            </p>
          </div>

          {/* Grid de informações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem icon={Building2} label="Obra" value={titulo.obraNome || "-"} />
            <InfoItem icon={User} label="Credor" value={titulo.credor} />
            <InfoItem icon={FileText} label={titulo.tipoDocumento.toUpperCase()} value={titulo.documento} />
            <InfoItem icon={FileText} label="Nº Documento" value={titulo.numeroDocumento} />
            <InfoItem
              icon={Calendar}
              label="Emissão"
              value={format(parseDate(titulo.dataEmissao), "dd/MM/yyyy", { locale: ptBR })}
            />
            <InfoItem
              icon={Calendar}
              label="Vencimento"
              value={format(parseDate(titulo.dataVencimento), "dd/MM/yyyy", { locale: ptBR })}
            />
            <InfoItem icon={CreditCard} label="Centro de Custo" value={titulo.centroCusto} />
            <InfoItem icon={Banknote} label="Plano Financeiro" value={planoFinanceiroLabels[titulo.planoFinanceiro]} />
            {titulo.idSienge && <InfoItem icon={RefreshCw} label="ID Sienge" value={titulo.idSienge.toString()} />}
          </div>

          {titulo.descricao && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Descrição</p>
              <p className="text-foreground">{titulo.descricao}</p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Etapa Apropriada</p>
            <p className="text-foreground">{titulo.etapaApropriada}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Tipo de Documento</p>
            <p className="text-foreground">
              {tipoDocumentoLabels[titulo.tipoDocumentoFiscal] || titulo.tipoDocumentoFiscal}
            </p>
          </div>

          {/* Documento Anexo */}
          {titulo.documentoUrl && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Documento Anexo</p>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => {
                  const { data } = supabase.storage.from("titulo-documentos").getPublicUrl(titulo.documentoUrl!);
                  window.open(data.publicUrl, "_blank");
                }}
              >
                <ExternalLink className="h-4 w-4" />
                Baixar/Visualizar Documento Anexo
              </Button>
            </div>
          )}

          {/* Dados Bancários / Pagamento */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Dados de Pagamento</p>

            {/* Tipo de Pagamento */}
            {titulo.tipoLeituraPagamento && (
              <div className="text-xs text-muted-foreground">
                Tipo:{" "}
                {titulo.tipoLeituraPagamento === "manual"
                  ? "Manual"
                  : titulo.tipoLeituraPagamento === "boleto"
                    ? "Boleto"
                    : "QR Code / Pix"}
              </div>
            )}

            {/* Link para arquivo de pagamento (Boleto/QR Code) */}
            {titulo.arquivoPagamentoUrl && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => {
                  const { data } = supabase.storage.from("titulo-documentos").getPublicUrl(titulo.arquivoPagamentoUrl!);
                  window.open(data.publicUrl, "_blank");
                }}
              >
                <ExternalLink className="h-4 w-4" />
                Visualizar Arquivo Original
              </Button>
            )}

            {/* Código/Dados Bancários com botão de copiar */}
            {titulo.dadosBancarios && titulo.dadosBancarios.trim() && (
              <div className="space-y-2">
                <div className="bg-muted/50 rounded-lg p-3 font-mono text-sm break-all">{titulo.dadosBancarios}</div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(titulo.dadosBancarios);
                    toast.success("Código copiado para a área de transferência");
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Copiar Código
                </Button>
              </div>
            )}

            {/* Mensagem se não houver dados */}
            {!titulo.arquivoPagamentoUrl && (!titulo.dadosBancarios || !titulo.dadosBancarios.trim()) && (
              <p className="text-sm text-muted-foreground italic">Nenhum dado de pagamento informado</p>
            )}
          </div>

          {titulo.motivoReprovacao && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-destructive">Motivo da Reprovação</p>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-foreground">{titulo.motivoReprovacao}</p>
              </div>
            </div>
          )}

          {/* Botão Replicar */}
          {onReplicate && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  onReplicate(titulo);
                  onClose();
                }}
              >
                <CopyPlus className="h-4 w-4" />
                Replicar Título
              </Button>
            </div>
          )}

          {/* Ações */}
          {showActions && (
            <>
              {titulo.status === "enviado" && !showRejectForm && (
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

              {titulo.status === "aprovado" && (
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
        credorName={titulo.credor}
        valorTotal={titulo.valorTotal}
      />

      {titulo.idSienge && (
        <SiengeUpdateModal
          tituloId={titulo.id}
          open={showSiengeModal}
          onClose={() => setShowSiengeModal(false)}
          idSienge={titulo.idSienge}
          tipoDocumento={titulo.tipoDocumentoFiscal}
          numeroDocumento={titulo.numeroDocumento}
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
