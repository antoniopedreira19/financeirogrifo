-- Update handle_new_user function to include empresa_id from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, empresa_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email),
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data ->> 'empresa_id')::uuid,
      '11111111-1111-1111-1111-111111111111'::uuid -- Default: Grifo Engenharia
    )
  );
  RETURN NEW;
END;
$$;