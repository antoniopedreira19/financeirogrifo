-- Create etapas table for obras
CREATE TABLE public.obra_etapas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id uuid NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  nome text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(obra_id, codigo)
);

-- Enable RLS
ALTER TABLE public.obra_etapas ENABLE ROW LEVEL SECURITY;

-- Admins can manage all etapas
CREATE POLICY "Admins can manage etapas"
ON public.obra_etapas
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view etapas from obras they have access to
CREATE POLICY "Users can view etapas from their obras"
ON public.obra_etapas
FOR SELECT
USING (has_obra_access(auth.uid(), obra_id));

-- Add codigo_etapa column to titulos
ALTER TABLE public.titulos ADD COLUMN codigo_etapa text;