-- Allow admins to delete titulos from their empresa
CREATE POLICY "Admins can delete empresa titulos"
ON public.titulos
FOR DELETE
USING (
  (empresa_id = get_user_empresa_id(auth.uid())) AND has_role(auth.uid(), 'admin'::app_role)
);