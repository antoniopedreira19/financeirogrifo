
-- Add boleto_url column to both tables
ALTER TABLE public.titulos ADD COLUMN IF NOT EXISTS boleto_url TEXT;
ALTER TABLE public.titulos_pendentes ADD COLUMN IF NOT EXISTS boleto_url TEXT;

-- Allow any authenticated user with obra access to update boleto_url on titulos
CREATE POLICY "Any user can update boleto_url on titulos"
ON public.titulos
FOR UPDATE
TO authenticated
USING (
  empresa_id = get_user_empresa_id(auth.uid())
  AND has_obra_access(auth.uid(), obra_id)
)
WITH CHECK (
  empresa_id = get_user_empresa_id(auth.uid())
  AND has_obra_access(auth.uid(), obra_id)
);

-- Allow any authenticated user with obra access to update boleto_url on titulos_pendentes
CREATE POLICY "Any user can update boleto_url on titulos_pendentes"
ON public.titulos_pendentes
FOR UPDATE
TO authenticated
USING (
  empresa_id = get_user_empresa_id(auth.uid())
  AND has_obra_access(auth.uid(), obra_id)
)
WITH CHECK (
  empresa_id = get_user_empresa_id(auth.uid())
  AND has_obra_access(auth.uid(), obra_id)
);
