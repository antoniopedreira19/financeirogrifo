-- Harden multi-tenant isolation by empresa (company)

-- 1) Prevent users from changing their own empresa_id (tenant) in profiles
--    This blocks privilege escalation where a user updates profiles.empresa_id to another company.
CREATE OR REPLACE FUNCTION public.prevent_profile_tenant_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow privileged backend operations (service role) if ever needed.
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.empresa_id IS DISTINCT FROM OLD.empresa_id THEN
    RAISE EXCEPTION 'empresa_id cannot be changed';
  END IF;

  -- Keep email immutable in the public profile row (auth email changes should be handled via auth, not here)
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'email cannot be changed';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'id cannot be changed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_tenant_change ON public.profiles;
CREATE TRIGGER trg_prevent_profile_tenant_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_tenant_change();


-- 2) Tighten admin ability on user_roles to the same empresa only
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage empresa roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND get_user_empresa_id(auth.uid()) = get_user_empresa_id(user_id)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND get_user_empresa_id(auth.uid()) = get_user_empresa_id(user_id)
);


-- 3) Tighten admin ability on user_obras (assignments) to the same empresa and to obras of that empresa
DROP POLICY IF EXISTS "Admins can manage user_obras" ON public.user_obras;

CREATE POLICY "Admins can manage empresa user_obras"
ON public.user_obras
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND get_user_empresa_id(auth.uid()) = get_user_empresa_id(user_id)
  AND EXISTS (
    SELECT 1
    FROM public.obras o
    WHERE o.id = obra_id
      AND o.empresa_id = get_user_empresa_id(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND get_user_empresa_id(auth.uid()) = get_user_empresa_id(user_id)
  AND EXISTS (
    SELECT 1
    FROM public.obras o
    WHERE o.id = obra_id
      AND o.empresa_id = get_user_empresa_id(auth.uid())
  )
);

-- Also tighten the user's own SELECT to ensure the assigned obra belongs to their empresa.
DROP POLICY IF EXISTS "Users can view their own obra assignments" ON public.user_obras;
CREATE POLICY "Users can view their own obra assignments"
ON public.user_obras
FOR SELECT
TO authenticated
USING (
  (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.obras o
      WHERE o.id = obra_id
        AND o.empresa_id = get_user_empresa_id(auth.uid())
    )
  )
  OR (
    has_role(auth.uid(), 'admin'::app_role)
    AND get_user_empresa_id(auth.uid()) = get_user_empresa_id(user_id)
    AND EXISTS (
      SELECT 1
      FROM public.obras o
      WHERE o.id = obra_id
        AND o.empresa_id = get_user_empresa_id(auth.uid())
    )
  )
);


-- 4) Tighten obra_etapas policies to the same empresa (defense-in-depth)
DROP POLICY IF EXISTS "Admins can manage etapas" ON public.obra_etapas;
CREATE POLICY "Admins can manage etapas"
ON public.obra_etapas
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.obras o
    WHERE o.id = obra_id
      AND o.empresa_id = get_user_empresa_id(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.obras o
    WHERE o.id = obra_id
      AND o.empresa_id = get_user_empresa_id(auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can view etapas from their obras" ON public.obra_etapas;
CREATE POLICY "Users can view etapas from their obras"
ON public.obra_etapas
FOR SELECT
TO authenticated
USING (
  has_obra_access(auth.uid(), obra_id)
  AND EXISTS (
    SELECT 1
    FROM public.obras o
    WHERE o.id = obra_id
      AND o.empresa_id = get_user_empresa_id(auth.uid())
  )
);
