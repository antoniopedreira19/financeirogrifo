CREATE TABLE public.obra_centros_custo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id uuid NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(obra_id, codigo)
);

ALTER TABLE public.obra_centros_custo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage centros_custo"
ON public.obra_centros_custo
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND EXISTS (
    SELECT 1 FROM obras o 
    WHERE o.id = obra_centros_custo.obra_id 
    AND o.empresa_id = get_user_empresa_id(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND EXISTS (
    SELECT 1 FROM obras o 
    WHERE o.id = obra_centros_custo.obra_id 
    AND o.empresa_id = get_user_empresa_id(auth.uid())
  )
);

CREATE POLICY "Users can view centros_custo from their obras"
ON public.obra_centros_custo
FOR SELECT
TO authenticated
USING (
  has_obra_access(auth.uid(), obra_id) 
  AND EXISTS (
    SELECT 1 FROM obras o 
    WHERE o.id = obra_centros_custo.obra_id 
    AND o.empresa_id = get_user_empresa_id(auth.uid())
  )
);

CREATE POLICY "Orcamento users can manage centros_custo"
ON public.obra_centros_custo
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'orcamento'::app_role) 
  AND EXISTS (
    SELECT 1 FROM obras o 
    WHERE o.id = obra_centros_custo.obra_id 
    AND o.empresa_id = get_user_empresa_id(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'orcamento'::app_role) 
  AND EXISTS (
    SELECT 1 FROM obras o 
    WHERE o.id = obra_centros_custo.obra_id 
    AND o.empresa_id = get_user_empresa_id(auth.uid())
  )
);