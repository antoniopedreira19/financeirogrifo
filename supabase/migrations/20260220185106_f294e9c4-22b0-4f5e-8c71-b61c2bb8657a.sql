
CREATE OR REPLACE FUNCTION public.enviar_titulos_n8n()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Só dispara quando status for 'pago' (pagamento manual)
  -- Pagamentos via Asaas chegam com status 'processando_pagamento' e têm seu próprio fluxo no n8n
  IF NEW.status <> 'pago' THEN
    RETURN NEW;
  END IF;

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
$function$
