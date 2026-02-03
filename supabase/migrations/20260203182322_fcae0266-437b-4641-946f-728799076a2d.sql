-- 1) Fix RLS: allow admins to INSERT into titulos (used when moving pago from titulos_pendentes -> titulos)
DROP POLICY IF EXISTS "Admins can insert empresa titulos" ON public.titulos;
CREATE POLICY "Admins can insert empresa titulos"
ON public.titulos
FOR INSERT
TO authenticated
WITH CHECK (
  empresa_id = get_user_empresa_id(auth.uid())
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- 2) Linter: set immutable search_path on functions
CREATE OR REPLACE FUNCTION public.enviar_para_n8n()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- A correção está aqui: "net.http_post" em vez de "extensions.net_http_post"
  PERFORM net.http_post(
    url := 'https://grifoworkspace.app.n8n.cloud/webhook/titulos-sienge-pendentes'::text,
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD)
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enviar_titulos_n8n()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM net.http_post(
    url := 'https://grifoworkspace.app.n8n.cloud/webhook/titulos-sienge'::text,
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD)
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
