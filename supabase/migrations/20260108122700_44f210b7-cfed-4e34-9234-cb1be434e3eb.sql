-- Remove 'AD' from tipo_documento enum
-- First, update any existing records with 'AD' to a valid value
UPDATE public.titulos SET tipo_documento = 'NF' WHERE tipo_documento = 'AD';
UPDATE public.titulos_pendentes SET tipo_documento = 'NF' WHERE tipo_documento = 'AD';

-- Create new enum type without AD
CREATE TYPE tipo_documento_new AS ENUM ('NF', 'BOL', 'REC');

-- Update columns to use new type
ALTER TABLE public.titulos 
  ALTER COLUMN tipo_documento TYPE tipo_documento_new 
  USING tipo_documento::text::tipo_documento_new;

ALTER TABLE public.titulos_pendentes 
  ALTER COLUMN tipo_documento TYPE tipo_documento_new 
  USING tipo_documento::text::tipo_documento_new;

-- Drop old enum and rename new one
DROP TYPE tipo_documento;
ALTER TYPE tipo_documento_new RENAME TO tipo_documento;