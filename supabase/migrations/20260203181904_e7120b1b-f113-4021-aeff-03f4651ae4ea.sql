-- Drop existing restrictive policies and create permissive ones for obras
DROP POLICY IF EXISTS "Admins can manage empresa obras" ON public.obras;
DROP POLICY IF EXISTS "Users can view accessible obras" ON public.obras;

-- Create PERMISSIVE policies for obras (using AS PERMISSIVE explicitly)
CREATE POLICY "Admins can manage empresa obras" 
ON public.obras 
FOR ALL 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND empresa_id = get_user_empresa_id(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND empresa_id = get_user_empresa_id(auth.uid())
);

CREATE POLICY "Users can view accessible obras" 
ON public.obras 
FOR SELECT 
TO authenticated
USING (
  empresa_id = get_user_empresa_id(auth.uid()) 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR id IN (SELECT obra_id FROM user_obras WHERE user_id = auth.uid())
  )
);

-- Fix empresas policy
DROP POLICY IF EXISTS "Users can view their empresa" ON public.empresas;
CREATE POLICY "Users can view their empresa" 
ON public.empresas 
FOR SELECT 
TO authenticated
USING (id = get_user_empresa_id(auth.uid()));

-- Fix profiles policies
DROP POLICY IF EXISTS "Admins can view empresa profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view empresa profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND empresa_id = get_user_empresa_id(auth.uid())
);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Fix titulos policies  
DROP POLICY IF EXISTS "Users can view empresa titulos" ON public.titulos;
DROP POLICY IF EXISTS "Users can insert titulos for their empresa obras" ON public.titulos;
DROP POLICY IF EXISTS "Admins can update empresa titulos" ON public.titulos;
DROP POLICY IF EXISTS "Obra users can update their own pending empresa titulos" ON public.titulos;

CREATE POLICY "Users can view empresa titulos" 
ON public.titulos 
FOR SELECT 
TO authenticated
USING (
  empresa_id = get_user_empresa_id(auth.uid()) 
  AND has_obra_access(auth.uid(), obra_id)
);

CREATE POLICY "Users can insert titulos for their empresa obras" 
ON public.titulos 
FOR INSERT 
TO authenticated
WITH CHECK (
  empresa_id = get_user_empresa_id(auth.uid()) 
  AND has_obra_access(auth.uid(), obra_id) 
  AND created_by = auth.uid()
);

CREATE POLICY "Admins can update empresa titulos" 
ON public.titulos 
FOR UPDATE 
TO authenticated
USING (
  empresa_id = get_user_empresa_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Obra users can update their own pending titulos" 
ON public.titulos 
FOR UPDATE 
TO authenticated
USING (
  empresa_id = get_user_empresa_id(auth.uid()) 
  AND created_by = auth.uid() 
  AND status = 'enviado'::titulo_status
);

-- Fix titulos_pendentes policies
DROP POLICY IF EXISTS "Users can view empresa titulos_pendentes" ON public.titulos_pendentes;
DROP POLICY IF EXISTS "Users can insert titulos_pendentes for their empresa obras" ON public.titulos_pendentes;
DROP POLICY IF EXISTS "Admins can update empresa titulos_pendentes" ON public.titulos_pendentes;
DROP POLICY IF EXISTS "Admins can delete empresa titulos_pendentes" ON public.titulos_pendentes;
DROP POLICY IF EXISTS "Obra users can update their own pending empresa titulos_pendent" ON public.titulos_pendentes;

CREATE POLICY "Users can view empresa titulos_pendentes" 
ON public.titulos_pendentes 
FOR SELECT 
TO authenticated
USING (
  empresa_id = get_user_empresa_id(auth.uid()) 
  AND has_obra_access(auth.uid(), obra_id)
);

CREATE POLICY "Users can insert titulos_pendentes for their empresa obras" 
ON public.titulos_pendentes 
FOR INSERT 
TO authenticated
WITH CHECK (
  empresa_id = get_user_empresa_id(auth.uid()) 
  AND has_obra_access(auth.uid(), obra_id) 
  AND created_by = auth.uid()
);

CREATE POLICY "Admins can update empresa titulos_pendentes" 
ON public.titulos_pendentes 
FOR UPDATE 
TO authenticated
USING (
  empresa_id = get_user_empresa_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete empresa titulos_pendentes" 
ON public.titulos_pendentes 
FOR DELETE 
TO authenticated
USING (
  empresa_id = get_user_empresa_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Obra users can update their own pending titulos_pendentes" 
ON public.titulos_pendentes 
FOR UPDATE 
TO authenticated
USING (
  empresa_id = get_user_empresa_id(auth.uid()) 
  AND created_by = auth.uid() 
  AND status = 'enviado'::titulo_status
);