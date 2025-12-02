-- Add grupo_id column to obras table for UAZAPI integration
ALTER TABLE public.obras ADD COLUMN grupo_id text;

-- Add grupo_id column to titulos table for UAZAPI integration
ALTER TABLE public.titulos ADD COLUMN grupo_id text;

-- Add grupo_id column to titulos_pendentes table for UAZAPI integration
ALTER TABLE public.titulos_pendentes ADD COLUMN grupo_id text;