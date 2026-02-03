-- =====================================================
-- FASE 1: ESTRUTURA DO BANCO DE DADOS
-- =====================================================

-- 1. Criar tabela empresas
CREATE TABLE public.empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Habilitar RLS na tabela empresas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- 3. Inserir Grifo Engenharia com ID fixo
INSERT INTO public.empresas (id, nome) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Grifo Engenharia');

-- 4. Adicionar empresa_id nas tabelas existentes
ALTER TABLE public.profiles ADD COLUMN empresa_id uuid REFERENCES public.empresas(id);
ALTER TABLE public.obras ADD COLUMN empresa_id uuid REFERENCES public.empresas(id);
ALTER TABLE public.titulos ADD COLUMN empresa_id uuid REFERENCES public.empresas(id);
ALTER TABLE public.titulos_pendentes ADD COLUMN empresa_id uuid REFERENCES public.empresas(id);

-- 5. Preencher todos os registros existentes com Grifo Engenharia
UPDATE public.profiles SET empresa_id = '11111111-1111-1111-1111-111111111111' WHERE empresa_id IS NULL;
UPDATE public.obras SET empresa_id = '11111111-1111-1111-1111-111111111111' WHERE empresa_id IS NULL;
UPDATE public.titulos SET empresa_id = '11111111-1111-1111-1111-111111111111' WHERE empresa_id IS NULL;
UPDATE public.titulos_pendentes SET empresa_id = '11111111-1111-1111-1111-111111111111' WHERE empresa_id IS NULL;

-- 6. Tornar empresa_id NOT NULL
ALTER TABLE public.profiles ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.obras ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.titulos ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.titulos_pendentes ALTER COLUMN empresa_id SET NOT NULL;

-- 7. Criar funcao helper get_user_empresa_id
CREATE OR REPLACE FUNCTION public.get_user_empresa_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id FROM public.profiles WHERE id = _user_id
$$;

-- =====================================================
-- FASE 2: ATUALIZAR POLICIES RLS
-- =====================================================

-- 8. Policy para tabela empresas
CREATE POLICY "Users can view their empresa"
ON public.empresas FOR SELECT
USING (id = get_user_empresa_id(auth.uid()));

-- 9. Atualizar policies de PROFILES
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view empresa profiles"
ON public.profiles FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND empresa_id = get_user_empresa_id(auth.uid())
);

-- 10. Atualizar policies de OBRAS
DROP POLICY IF EXISTS "Admins can manage all obras" ON public.obras;
DROP POLICY IF EXISTS "Users can view obras they have access to" ON public.obras;

CREATE POLICY "Admins can manage empresa obras"
ON public.obras FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND empresa_id = get_user_empresa_id(auth.uid())
);

CREATE POLICY "Users can view accessible obras"
ON public.obras FOR SELECT
USING (
  empresa_id = get_user_empresa_id(auth.uid())
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR id IN (SELECT obra_id FROM user_obras WHERE user_id = auth.uid())
  )
);

-- 11. Atualizar policies de TITULOS
DROP POLICY IF EXISTS "Users can view titulos from their obras" ON public.titulos;
DROP POLICY IF EXISTS "Users can insert titulos for their obras" ON public.titulos;
DROP POLICY IF EXISTS "Admins can update any titulo" ON public.titulos;
DROP POLICY IF EXISTS "Admins can insert titulos" ON public.titulos;
DROP POLICY IF EXISTS "Obra users can update their own pending titulos" ON public.titulos;

CREATE POLICY "Users can view empresa titulos"
ON public.titulos FOR SELECT
USING (
  empresa_id = get_user_empresa_id(auth.uid())
  AND has_obra_access(auth.uid(), obra_id)
);

CREATE POLICY "Users can insert titulos for their empresa obras"
ON public.titulos FOR INSERT
WITH CHECK (
  empresa_id = get_user_empresa_id(auth.uid())
  AND has_obra_access(auth.uid(), obra_id)
  AND created_by = auth.uid()
);

CREATE POLICY "Admins can update empresa titulos"
ON public.titulos FOR UPDATE
USING (
  empresa_id = get_user_empresa_id(auth.uid())
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Obra users can update their own pending empresa titulos"
ON public.titulos FOR UPDATE
USING (
  empresa_id = get_user_empresa_id(auth.uid())
  AND created_by = auth.uid()
  AND status = 'enviado'::titulo_status
);

-- 12. Atualizar policies de TITULOS_PENDENTES
DROP POLICY IF EXISTS "Users can view titulos_pendentes from their obras" ON public.titulos_pendentes;
DROP POLICY IF EXISTS "Users can insert titulos_pendentes for their obras" ON public.titulos_pendentes;
DROP POLICY IF EXISTS "Admins can update any titulo_pendente" ON public.titulos_pendentes;
DROP POLICY IF EXISTS "Admins can delete titulos_pendentes" ON public.titulos_pendentes;
DROP POLICY IF EXISTS "Obra users can update their own pending titulos_pendentes" ON public.titulos_pendentes;

CREATE POLICY "Users can view empresa titulos_pendentes"
ON public.titulos_pendentes FOR SELECT
USING (
  empresa_id = get_user_empresa_id(auth.uid())
  AND has_obra_access(auth.uid(), obra_id)
);

CREATE POLICY "Users can insert titulos_pendentes for their empresa obras"
ON public.titulos_pendentes FOR INSERT
WITH CHECK (
  empresa_id = get_user_empresa_id(auth.uid())
  AND has_obra_access(auth.uid(), obra_id)
  AND created_by = auth.uid()
);

CREATE POLICY "Admins can update empresa titulos_pendentes"
ON public.titulos_pendentes FOR UPDATE
USING (
  empresa_id = get_user_empresa_id(auth.uid())
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete empresa titulos_pendentes"
ON public.titulos_pendentes FOR DELETE
USING (
  empresa_id = get_user_empresa_id(auth.uid())
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Obra users can update their own pending empresa titulos_pendentes"
ON public.titulos_pendentes FOR UPDATE
USING (
  empresa_id = get_user_empresa_id(auth.uid())
  AND created_by = auth.uid()
  AND status = 'enviado'::titulo_status
);