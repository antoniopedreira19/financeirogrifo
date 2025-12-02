-- Create titulos_pendentes table with same structure as titulos
CREATE TABLE public.titulos_pendentes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa text NOT NULL,
  credor text NOT NULL,
  documento_tipo text NOT NULL,
  documento_numero text NOT NULL,
  obra_id uuid NOT NULL,
  obra_codigo text NOT NULL,
  centro_custo text NOT NULL,
  etapa text NOT NULL,
  codigo_etapa text,
  valor_total numeric NOT NULL,
  descontos numeric DEFAULT 0,
  parcelas integer NOT NULL DEFAULT 1,
  tipo_documento tipo_documento NOT NULL,
  numero_documento text NOT NULL,
  data_emissao date NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento date NOT NULL,
  plano_financeiro plano_financeiro NOT NULL,
  dados_bancarios jsonb,
  documento_url text,
  status titulo_status NOT NULL DEFAULT 'enviado'::titulo_status,
  criador text NOT NULL,
  created_by uuid NOT NULL,
  aprovado_por uuid,
  aprovado_em timestamp with time zone,
  motivo_reprovacao text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.titulos_pendentes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for titulos_pendentes
CREATE POLICY "Users can view titulos_pendentes from their obras"
ON public.titulos_pendentes
FOR SELECT
USING (has_obra_access(auth.uid(), obra_id));

CREATE POLICY "Users can insert titulos_pendentes for their obras"
ON public.titulos_pendentes
FOR INSERT
WITH CHECK (has_obra_access(auth.uid(), obra_id) AND created_by = auth.uid());

CREATE POLICY "Admins can update any titulo_pendente"
ON public.titulos_pendentes
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Obra users can update their own pending titulos_pendentes"
ON public.titulos_pendentes
FOR UPDATE
USING (created_by = auth.uid() AND status = 'enviado'::titulo_status);

CREATE POLICY "Admins can delete titulos_pendentes"
ON public.titulos_pendentes
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_titulos_pendentes_updated_at
BEFORE UPDATE ON public.titulos_pendentes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();