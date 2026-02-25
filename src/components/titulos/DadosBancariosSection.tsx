import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, Image, Receipt, QrCode, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { toast } from "sonner";

export type MetodoPagamento = "PIX" | "BOLETO" | "TED";

export type TipoChavePix = "CPF" | "CNPJ" | "EMAIL" | "CELULAR" | "EVP" | "COPIA_COLA";

export type TipoConta = "corrente" | "poupanca";

export interface DadosBancariosStructured {
  metodo_pagamento: MetodoPagamento;
  // PIX fields
  tipo_chave_pix?: TipoChavePix;
  chave_pix?: string;
  // TED fields
  banco?: string;
  agencia?: string;
  conta?: string;
  tipo_conta?: TipoConta;
  cpf_cnpj_titular?: string;
}

interface DadosBancariosSectionProps {
  value: DadosBancariosStructured;
  onChange: (value: DadosBancariosStructured) => void;
  paymentFile: File | null;
  onPaymentFileChange: (file: File | null) => void;
  error?: string;
}

export function DadosBancariosSection({
  value,
  onChange,
  paymentFile,
  onPaymentFileChange,
  error,
}: DadosBancariosSectionProps) {
  const paymentFileInputRef = useRef<HTMLInputElement>(null);

  const setMetodo = (metodo: MetodoPagamento) => {
    onChange({ metodo_pagamento: metodo });
  };

  const update = (partial: Partial<DadosBancariosStructured>) => {
    onChange({ ...value, ...partial });
  };

  const handlePaymentFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato não suportado. Use PDF, JPEG ou PNG.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB.");
      return;
    }
    onPaymentFileChange(file);
  };

  const removePaymentFile = () => {
    onPaymentFileChange(null);
    if (paymentFileInputRef.current) paymentFileInputRef.current.value = "";
  };

  const metodo = value.metodo_pagamento;

  return (
    <div className="card-elevated p-6">
      <h2 className="text-lg font-semibold mb-4">Dados Bancários para Pagamento</h2>
      <div className="space-y-4">
        {/* Método de Pagamento */}
        <div className="space-y-2">
          <Label>Método de Pagamento</Label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setMetodo("PIX")}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                metodo === "PIX"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50 hover:bg-muted/50",
              )}
            >
              <QrCode className="h-6 w-6" />
              <span className="text-sm font-medium">PIX</span>
            </button>
            <button
              type="button"
              onClick={() => setMetodo("BOLETO")}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                metodo === "BOLETO"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50 hover:bg-muted/50",
              )}
            >
              <Receipt className="h-6 w-6" />
              <span className="text-sm font-medium">Boleto</span>
            </button>
            <button
              type="button"
              onClick={() => setMetodo("TED")}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                metodo === "TED"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50 hover:bg-muted/50",
              )}
            >
              <Building2 className="h-6 w-6" />
              <span className="text-sm font-medium">TED</span>
            </button>
          </div>
        </div>

        {/* PIX Fields */}
        {metodo === "PIX" && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="space-y-2">
              <Label>Tipo de Chave PIX</Label>
              <Select
                value={value.tipo_chave_pix || ""}
                onValueChange={(v: TipoChavePix) => update({ tipo_chave_pix: v, chave_pix: "" })}
              >
                <SelectTrigger className="input-field">
                  <SelectValue placeholder="Selecione o tipo de chave" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CPF">CPF</SelectItem>
                  <SelectItem value="CNPJ">CNPJ</SelectItem>
                  <SelectItem value="EMAIL">E-mail</SelectItem>
                  <SelectItem value="CELULAR">Celular</SelectItem>
                  <SelectItem value="EVP">Chave Aleatória (EVP)</SelectItem>
                  <SelectItem value="COPIA_COLA">Copia e Cola (QR Code)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {value.tipo_chave_pix && (
              <div className="space-y-2">
                <Label>{getPixKeyLabel(value.tipo_chave_pix)}</Label>
                {value.tipo_chave_pix === "COPIA_COLA" ? (
                  <Textarea
                    value={value.chave_pix || ""}
                    onChange={(e) => update({ chave_pix: e.target.value })}
                    placeholder="Cole o código PIX Copia e Cola aqui..."
                    rows={3}
                    className="input-field resize-none"
                  />
                ) : (
                  <Input
                    value={value.chave_pix || ""}
                    onChange={(e) => update({ chave_pix: e.target.value })}
                    placeholder={getPixKeyPlaceholder(value.tipo_chave_pix)}
                    className="input-field"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* BOLETO Fields */}
        {metodo === "BOLETO" && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
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
                  <p className="text-sm text-muted-foreground">Anexe o arquivo do boleto</p>
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
          </div>
        )}

        {/* TED Fields */}
        {metodo === "TED" && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Banco (Código ou Nome)</Label>
                <Input
                  value={value.banco || ""}
                  onChange={(e) => update({ banco: e.target.value })}
                  placeholder="Ex: 001 - Banco do Brasil"
                  className="input-field"
                />
              </div>
              <div className="space-y-2">
                <Label>Agência</Label>
                <Input
                  value={value.agencia || ""}
                  onChange={(e) => update({ agencia: e.target.value })}
                  placeholder="Ex: 1234"
                  className="input-field"
                />
              </div>
              <div className="space-y-2">
                <Label>Conta (com dígito)</Label>
                <Input
                  value={value.conta || ""}
                  onChange={(e) => update({ conta: e.target.value })}
                  placeholder="Ex: 12345-6"
                  className="input-field"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Conta</Label>
                <Select
                  value={value.tipo_conta || ""}
                  onValueChange={(v: TipoConta) => update({ tipo_conta: v })}
                >
                  <SelectTrigger className="input-field">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Conta Corrente</SelectItem>
                    <SelectItem value="poupanca">Conta Poupança</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>CPF/CNPJ do Titular</Label>
                <Input
                  value={value.cpf_cnpj_titular || ""}
                  onChange={(e) => update({ cpf_cnpj_titular: e.target.value })}
                  placeholder="CPF ou CNPJ do titular da conta"
                  className="input-field"
                />
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}

function getPixKeyLabel(tipo: TipoChavePix): string {
  const labels: Record<TipoChavePix, string> = {
    CPF: "CPF",
    CNPJ: "CNPJ",
    EMAIL: "E-mail",
    CELULAR: "Celular",
    EVP: "Chave Aleatória",
    COPIA_COLA: "Código PIX Copia e Cola",
  };
  return labels[tipo];
}

function getPixKeyPlaceholder(tipo: TipoChavePix): string {
  const placeholders: Record<TipoChavePix, string> = {
    CPF: "000.000.000-00",
    CNPJ: "00.000.000/0000-00",
    EMAIL: "exemplo@email.com",
    CELULAR: "(11) 99999-9999",
    EVP: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    COPIA_COLA: "",
  };
  return placeholders[tipo];
}
