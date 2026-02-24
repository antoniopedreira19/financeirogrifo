
-- Allow orcamento users to view all empresa obras (read-only)
CREATE POLICY "Orcamento users view empresa obras"
ON public.obras
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'orcamento'::app_role)
  AND empresa_id = get_user_empresa_id(auth.uid())
);

-- Allow orcamento users to manage etapas (full CRUD)
CREATE POLICY "Orcamento users can manage empresa etapas"
ON public.obra_etapas
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'orcamento'::app_role)
  AND EXISTS (
    SELECT 1 FROM obras o
    WHERE o.id = obra_etapas.obra_id
    AND o.empresa_id = get_user_empresa_id(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'orcamento'::app_role)
  AND EXISTS (
    SELECT 1 FROM obras o
    WHERE o.id = obra_etapas.obra_id
    AND o.empresa_id = get_user_empresa_id(auth.uid())
  )
);
