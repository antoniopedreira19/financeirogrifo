-- Create new enum with codes
CREATE TYPE tipo_documento_new AS ENUM ('NF', 'BOL', 'REC', 'AD');

-- Update titulos_pendentes to use text temporarily
ALTER TABLE public.titulos_pendentes 
ALTER COLUMN tipo_documento TYPE text USING tipo_documento::text;

-- Update values in titulos_pendentes
UPDATE public.titulos_pendentes SET tipo_documento = 'NF' WHERE tipo_documento = 'nota_fiscal';
UPDATE public.titulos_pendentes SET tipo_documento = 'BOL' WHERE tipo_documento = 'boleto';
UPDATE public.titulos_pendentes SET tipo_documento = 'REC' WHERE tipo_documento = 'recibo';
UPDATE public.titulos_pendentes SET tipo_documento = 'AD' WHERE tipo_documento IN ('contrato', 'outro');

-- Update titulos to use text temporarily  
ALTER TABLE public.titulos
ALTER COLUMN tipo_documento TYPE text USING tipo_documento::text;

-- Update values in titulos
UPDATE public.titulos SET tipo_documento = 'NF' WHERE tipo_documento = 'nota_fiscal';
UPDATE public.titulos SET tipo_documento = 'BOL' WHERE tipo_documento = 'boleto';
UPDATE public.titulos SET tipo_documento = 'REC' WHERE tipo_documento = 'recibo';
UPDATE public.titulos SET tipo_documento = 'AD' WHERE tipo_documento IN ('contrato', 'outro');

-- Drop old enum and rename new one
DROP TYPE IF EXISTS tipo_documento;
ALTER TYPE tipo_documento_new RENAME TO tipo_documento;

-- Convert columns back to enum
ALTER TABLE public.titulos_pendentes
ALTER COLUMN tipo_documento TYPE tipo_documento USING tipo_documento::tipo_documento;

ALTER TABLE public.titulos
ALTER COLUMN tipo_documento TYPE tipo_documento USING tipo_documento::tipo_documento;