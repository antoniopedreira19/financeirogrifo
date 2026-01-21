import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Upload, X, FileText, Image, Receipt, FileEdit, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateTitulo } from "@/hooks/useTitulosQuery";
import { useNavigate } from "react-router-dom";
import { DocumentoTipo, Titulo } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useEtapasByObra } from "@/hooks/useEtapasQuery";

type TipoPagamento = "manual" | "boleto";

// 1. Atualizado o schema para incluir "PRV"
const tituloSchema = z.object({
  empresa: z.number().min(1, "Código da empresa é obrigatório"),
  credor: z.string().min(1, "Credor é obrigatório"),
  tipoDocumento: z.enum(["cnpj", "cpf"]),
  documento: z.string().min(1, "Documento é obrigatório"),
  centroCusto: z.string().optional().default(""),
  etapaApropriada: z.string().optional().default(""),
  valorTotal: z.number().min(0.01, "Valor deve ser maior que zero"),
  descontos: z.number().min(0, "Descontos não pode ser negativo").default(0),
  parcelas: z.number().min(1, "Mínimo 1 parcela"),
  tipoDocumentoFiscal: z.enum(["NF", "BOL", "REC", "PRV", "FAT"]), // <--- ADICIONADO PRV
  numeroDocumento: z.string().min(1, "Número do documento é obrigatório"),
  dataEmissao: z.date(),
  dataVencimento: z.date(),
  planoFinanceiro: z.enum(["servicos_terceiros", "materiais_aplicados"]),
  dadosBancarios: z.string().optional().default(""),
  descricao: z.string().max(500, "Descrição muito longa (máx. 500 caracteres)").optional().default(""),
});

type TituloFormData = z.infer<typeof tituloSchema>;

interface TituloFormProps {
  selectedObraOverride?: { id: string; codigo: string; nome: string };
  redirectPath?: string;
  initialData?: Titulo;
}

export function TituloForm({ selectedObraOverride, redirectPath = "/obra/titulos", initialData }: TituloFormProps) {
  const { user, selectedObra: contextSelectedObra } = useAuth();
  const selectedObra = selectedObraOverride || contextSelectedObra;
  const createTituloMutation = useCreateTitulo();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [tipoPagamento, setTipoPagamento] = useState<TipoPagamento>(
    initialData?.tipoLeituraPagamento === "boleto" ? "boleto" : "manual",
  );
  const [isUploading, setIsUploading] = useState(false);
  const [obraGrupoId, setObraGrupoId] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const paymentFileInputRef = useRef<HTMLInputElement>(null);
  const { data: etapas = [] } = useEtapasByObra(selectedObra?.id);

  // Fetch obra details to get grupo_id
  useEffect(() => {
    if (selectedObra?.id) {
      supabase
        .from("obras")
        .select("grupo_id")
        .eq("id", selectedObra.id)
        .single()
        .then(({ data }) => {
          if (data?.grupo_id) {
            setObraGrupoId(data.grupo_id);
          }
        });
    }
  }, [selectedObra?.id]);

  const validateAndSetFile = (file: File, setter: (f: File | null) => void) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato não suportado. Use PDF, JPEG ou PNG.");
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB.");
      return false;
    }
    setter(file);
    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) validateAndSetFile(file, setSelectedFile);
  };

  const handlePaymentFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) validateAndSetFile(file, setPaymentFile);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePaymentFile = () => {
    setPaymentFile(null);
    if (paymentFileInputRef.current) {
      paymentFileInputRef.current.value = "";
    }
  };

  const uploadFile = async (file: File, prefix: string): Promise<string | null> => {
    if (!file || !user) return null;

    const uniqueId = crypto.randomUUID();
    const fileExt = file.name.split(".").pop();
    const fileName = `${prefix}_${uniqueId}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error } = await supabase.storage.from("titulo-documentos").upload(filePath, file, { upsert: true });

    if (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar documento.");
      return null;
    }

    return filePath;
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TituloFormData>({
    resolver: zodResolver(tituloSchema),
    defaultValues: {
      tipoDocumento: (initialData?.tipoDocumento as "cnpj" | "cpf") || "cnpj",
      dataEmissao: initialData?.dataEmissao ? new Date(initialData.dataEmissao) : new Date(),
      dataVencimento: initialData?.dataVencimento ? new Date(initialData.dataVencimento) : undefined,
      parcelas: initialData?.parcelas || 1,
      descontos: initialData?.descontos || 0,
      // 2. Atualizado o tipo do valor padrão
      tipoDocumentoFiscal: (initialData?.tipoDocumentoFiscal as "NF" | "BOL" | "REC" | "PRV" | "FAT") || "NF",
      planoFinanceiro: initialData?.planoFinanceiro || "servicos_terceiros",
      empresa: initialData?.empresa ? Number(initialData.empresa) : undefined,
      credor: initialData?.credor || "",
      documento: initialData?.documento || "",
      centroCusto: initialData?.centroCusto || "",
      etapaApropriada: initialData?.codigoEtapa || "",
      valorTotal: initialData?.valorTotal || undefined,
      numeroDocumento: initialData?.numeroDocumento || "",
      dadosBancarios: initialData?.dadosBancarios || "",
      descricao: initialData?.descricao || "",
    },
  });

  const tipoDocumento = watch("tipoDocumento");
  const dataEmissao = watch("dataEmissao");
  const dataVencimento = watch("dataVencimento");

  const onSubmit = async (data: TituloFormData) => {
    if (!selectedObra || !user) return;

    // Validate dadosBancarios only for manual payment type
    if (tipoPagamento === "manual" && !data.dadosBancarios?.trim()) {
      toast.error("Dados bancários são obrigatórios para pagamento manual");
      return;
    }

    setIsUploading(true);

    // Upload files FIRST before creating titulo
    let documentoUrl: string | undefined;
    let arquivoPagamentoUrl: string | undefined;

    try {
      if (selectedFile) {
        const filePath = await uploadFile(selectedFile, "doc");
        if (filePath) documentoUrl = filePath;
      }

      if (paymentFile && tipoPagamento !== "manual") {
        const paymentPath = await uploadFile(paymentFile, "pagamento");
        if (paymentPath) arquivoPagamentoUrl = paymentPath;
      }
    } catch (error) {
      console.error("Upload error:", error);
      setIsUploading(false);
      return;
    }

    // Find the etapa name if etapas exist
    const selectedEtapa = etapas.find((e) => e.codigo === data.etapaApropriada);
    const etapaNome = selectedEtapa ? `${selectedEtapa.codigo} - ${selectedEtapa.nome}` : data.etapaApropriada;

    createTituloMutation.mutate(
      {
        empresa: String(data.empresa),
        credor: data.credor,
        documentoTipo: data.tipoDocumento,
        documentoNumero: data.documento,
        obraId: selectedObra.id,
        obraCodigo: selectedObra.codigo,
        grupoId: obraGrupoId,
        centroCusto: data.centroCusto,
        etapa: etapaNome,
        codigoEtapa: data.etapaApropriada,
        valorTotal: data.valorTotal,
        descontos: data.descontos || 0,
        parcelas: data.parcelas,
        tipoDocumento: data.tipoDocumentoFiscal,
        numeroDocumento: data.numeroDocumento,
        dataEmissao: data.dataEmissao,
        dataVencimento: data.dataVencimento,
        planoFinanceiro: data.planoFinanceiro,
        dadosBancarios: data.dadosBancarios,
        tipoLeituraPagamento: tipoPagamento,
        createdBy: user.id,
        criador: user.nome,
        documentoUrl,
        arquivoPagamentoUrl,
        descricao: data.descricao || undefined,
      },
      {
        onSuccess: () => {
          setIsUploading(false);
          navigate(redirectPath);
        },
        onError: () => {
          setIsUploading(false);
        },
      },
    );
  };

  const formatDocumento = (value: string, tipo: "cnpj" | "cpf") => {
    const numbers = value.replace(/\D/g, "");
    if (tipo === "cpf") {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
        .slice(0, 14);
    }
    return numbers
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
      .slice(0, 18);
  };

  const isSubmitting = createTituloMutation.isPending || isUploading;

  const getFileIcon = () => {
    if (!selectedFile) return null;
    if (selectedFile.type === "application/pdf") return <FileText className="h-5 w-5 text-destructive" />;
    return <Image className="h-5 w-5 text-primary" />;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Informações Básicas */}
      <div className="card-elevated p-6">
        <h2 className="text-lg font-semibold mb-4">Informações Básicas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="empresa">Empresa</Label>
            <Input
              id="empresa"
              type="number"
              placeholder="Código da empresa"
              {...register("empresa", { valueAsNumber: true })}
              className="input-field"
            />
            {errors.empresa && <p className="text-sm text-destructive">{errors.empresa.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="credor">Credor</Label>
            <Input
              id="credor"
              placeholder="Nome do fornecedor/credor"
              {...register("credor")}
              className="input-field"
            />
            {errors.credor && <p className="text-sm text-destructive">{errors.credor.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Tipo de Documento</Label>
            <Select value={tipoDocumento} onValueChange={(value: "cnpj" | "cpf") => setValue("tipoDocumento", value)}>
              <SelectTrigger className="input-field">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cnpj">CNPJ</SelectItem>
                <SelectItem value="cpf">CPF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="documento">{tipoDocumento === "cnpj" ? "CNPJ" : "CPF"}</Label>
            <Input
              id="documento"
              placeholder={tipoDocumento === "cnpj" ? "00.000.000/0000-00" : "000.000.000-00"}
              {...register("documento")}
              onChange={(e) => {
                const formatted = formatDocumento(e.target.value, tipoDocumento);
                setValue("documento", formatted);
              }}
              className="input-field"
            />
            {errors.documento && <p className="text-sm text-destructive">{errors.documento.message}</p>}
          </div>
        </div>
      </div>

      {/* Informações da Obra */}
      <div className="card-elevated p-6">
        <h2 className="text-lg font-semibold mb-4">Informações da Obra</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome da Obra</Label>
            <Input value={selectedObra?.nome || ""} disabled className="input-field bg-muted" />
          </div>

          <div className="space-y-2">
            <Label>Código da Obra</Label>
            <Input value={selectedObra?.codigo || ""} disabled className="input-field bg-muted" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="centroCusto">Centro de Custo Apropriado</Label>
            <Input id="centroCusto" placeholder="Ex: 21101" {...register("centroCusto")} className="input-field" />
            {errors.centroCusto && <p className="text-sm text-destructive">{errors.centroCusto.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="etapaApropriada">Etapa Apropriada</Label>
            {etapas.length > 0 ? (
              <Select onValueChange={(value) => setValue("etapaApropriada", value)}>
                <SelectTrigger className="input-field">
                  <SelectValue placeholder="Selecione a etapa" />
                </SelectTrigger>
                <SelectContent>
                  {etapas.map((etapa) => (
                    <SelectItem key={etapa.id} value={etapa.codigo}>
                      {etapa.codigo} - {etapa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="etapaApropriada"
                placeholder="Ex: Fundação, Estrutura..."
                {...register("etapaApropriada")}
                className="input-field"
              />
            )}
            {errors.etapaApropriada && <p className="text-sm text-destructive">{errors.etapaApropriada.message}</p>}
          </div>
        </div>
      </div>

      {/* Valores e Parcelas */}
      <div className="card-elevated p-6">
        <h2 className="text-lg font-semibold mb-4">Valores e Parcelas</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="valorTotal">Valor Total (R$)</Label>
            <Input
              id="valorTotal"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...register("valorTotal", { valueAsNumber: true })}
              className="input-field"
            />
            {errors.valorTotal && <p className="text-sm text-destructive">{errors.valorTotal.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descontos">Descontos (R$)</Label>
            <Input
              id="descontos"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...register("descontos", { valueAsNumber: true })}
              className="input-field"
            />
            {errors.descontos && <p className="text-sm text-destructive">{errors.descontos.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="parcelas">Número de Parcelas</Label>
            <Input
              id="parcelas"
              type="number"
              min="1"
              {...register("parcelas", { valueAsNumber: true })}
              className="input-field"
            />
            {errors.parcelas && <p className="text-sm text-destructive">{errors.parcelas.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Plano Financeiro</Label>
            <Select
              defaultValue="servicos_terceiros"
              onValueChange={(value: "servicos_terceiros" | "materiais_aplicados") =>
                setValue("planoFinanceiro", value)
              }
            >
              <SelectTrigger className="input-field">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="servicos_terceiros">Serviços de Terceiros</SelectItem>
                <SelectItem value="materiais_aplicados">Materiais Aplicados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Documento Fiscal */}
      <div className="card-elevated p-6">
        <h2 className="text-lg font-semibold mb-4">Documento Fiscal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Documento</Label>
            {/* 3. Atualizada a tipagem no onValueChange e adicionado Item PRV */}
            <Select
              defaultValue="NF"
              onValueChange={(value: "NF" | "BOL" | "REC" | "PRV" | "FAT") => setValue("tipoDocumentoFiscal", value)}
            >
              <SelectTrigger className="input-field">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NF">NF</SelectItem>
                <SelectItem value="BOL">BOL</SelectItem>
                <SelectItem value="REC">REC</SelectItem>
                <SelectItem value="FAT">FAT</SelectItem>
                <SelectItem value="PRV">PRV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numeroDocumento">Número do Documento</Label>
            <Input
              id="numeroDocumento"
              placeholder="Ex: NF-001234"
              {...register("numeroDocumento")}
              className="input-field"
            />
            {errors.numeroDocumento && <p className="text-sm text-destructive">{errors.numeroDocumento.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Data de Emissão</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal input-field",
                    !dataEmissao && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataEmissao ? format(dataEmissao, "dd/MM/yyyy") : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataEmissao}
                  onSelect={(date) => date && setValue("dataEmissao", date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Data de Vencimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal input-field",
                    !dataVencimento && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataVencimento ? format(dataVencimento, "dd/MM/yyyy") : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataVencimento}
                  onSelect={(date) => date && setValue("dataVencimento", date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {errors.dataVencimento && <p className="text-sm text-destructive">{errors.dataVencimento.message}</p>}
          </div>
        </div>
      </div>

      {/* Dados Bancários */}
      <div className="card-elevated p-6">
        <h2 className="text-lg font-semibold mb-4">Dados Bancários para Pagamento</h2>
        <div className="space-y-4">
          {/* Tipo de Pagamento */}
          <div className="space-y-2">
            <Label>Tipo de Leitura para Pagamento</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipoPagamento("manual")}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  tipoPagamento === "manual"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50 hover:bg-muted/50",
                )}
              >
                <FileEdit className="h-6 w-6" />
                <span className="text-sm font-medium">Manual</span>
                <span className="text-xs text-muted-foreground">Apenas texto</span>
              </button>
              <button
                type="button"
                onClick={() => setTipoPagamento("boleto")}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  tipoPagamento === "boleto"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50 hover:bg-muted/50",
                )}
              >
                <Receipt className="h-6 w-6" />
                <span className="text-sm font-medium">Boleto</span>
                <span className="text-xs text-muted-foreground">Upload</span>
              </button>
            </div>
          </div>

          {/* Upload de arquivo de pagamento (condicional) */}
          {tipoPagamento !== "manual" && (
            <div className="space-y-2">
              <Label>Arquivo do Boleto</Label>
              <input
                type="file"
                ref={paymentFileInputRef}
                onChange={handlePaymentFileSelect}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              {!paymentFile ? (
                <div
                  onClick={() => paymentFileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Anexe o boleto para facilitar o pagamento</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPEG ou PNG (máx. 10MB)</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
                  {paymentFile.type === "application/pdf" ? (
                    <FileText className="h-5 w-5 text-destructive" />
                  ) : (
                    <Image className="h-5 w-5 text-primary" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{paymentFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(paymentFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={removePaymentFile} className="shrink-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Campo de texto para dados bancários */}
          <div className="space-y-2">
            <Label htmlFor="dadosBancarios">
              {tipoPagamento === "manual" ? "Informações para pagamento" : "Informações adicionais"}
            </Label>
            <Textarea
              id="dadosBancarios"
              placeholder={
                tipoPagamento === "manual"
                  ? "PIX, dados da conta bancária, código de barras..."
                  : "Cole o código de barras aqui ou adicione informações adicionais..."
              }
              rows={4}
              {...register("dadosBancarios")}
              className="input-field resize-none"
            />
            {errors.dadosBancarios && <p className="text-sm text-destructive">{errors.dadosBancarios.message}</p>}
          </div>
        </div>
      </div>

      {/* Descrição (opcional) */}
      <div className="card-elevated p-6">
        <h2 className="text-lg font-semibold mb-4">Descrição</h2>
        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição do Título (opcional)</Label>
          <Textarea
            id="descricao"
            placeholder="Descreva o título, motivo do pagamento, observações..."
            rows={3}
            {...register("descricao")}
            className="input-field resize-none"
          />
          {errors.descricao && <p className="text-sm text-destructive">{errors.descricao.message}</p>}
        </div>
      </div>

      {/* Upload de Documento */}
      <div className="card-elevated p-6">
        <h2 className="text-lg font-semibold mb-4">Documento Anexo</h2>
        <div className="space-y-4">
          <Label>Anexar Arquivo. (PDF, JPEG ou PNG)</Label>

          {/* Aviso informativo */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">
                Envie o arquivo de comprovação do título para ser salvo na pasta financeira da obra.
              </p>
              <p className="mt-1 text-amber-700 dark:text-amber-300">
                Se anexou o boleto acima, anexe aqui também, se servir como comprovante.
              </p>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
          />

          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Clique para selecionar ou arraste o arquivo</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, JPEG ou PNG (máx. 10MB)</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
              {getFileIcon()}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={removeFile} className="shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => navigate(redirectPath)}>
          Cancelar
        </Button>
        <Button type="submit" variant="gold" disabled={isSubmitting} className="min-w-[150px]">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isUploading ? "Enviando arquivo..." : "Enviando..."}
            </>
          ) : (
            "Enviar Título"
          )}
        </Button>
      </div>
    </form>
  );
}
