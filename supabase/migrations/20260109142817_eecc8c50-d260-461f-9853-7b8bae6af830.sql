-- Add description column to titulos table
ALTER TABLE public.titulos 
ADD COLUMN descricao text;

-- Add description column to titulos_pendentes table
ALTER TABLE public.titulos_pendentes 
ADD COLUMN descricao text;