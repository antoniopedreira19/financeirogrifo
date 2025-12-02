-- Allow admins to insert into titulos table (needed when moving from titulos_pendentes to titulos)
CREATE POLICY "Admins can insert titulos"
ON public.titulos
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));