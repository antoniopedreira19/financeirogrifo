-- Add obra_codigo column to titulos table for ERP integration payload
ALTER TABLE public.titulos 
ADD COLUMN obra_codigo text;

-- Update existing titulos with the obra codigo from the obras table
UPDATE public.titulos t
SET obra_codigo = o.codigo
FROM public.obras o
WHERE t.obra_id = o.id;

-- Make the column NOT NULL after populating existing data
ALTER TABLE public.titulos 
ALTER COLUMN obra_codigo SET NOT NULL;