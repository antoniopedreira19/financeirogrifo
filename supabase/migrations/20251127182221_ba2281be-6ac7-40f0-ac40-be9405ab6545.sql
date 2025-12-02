-- Add criador column to store the creator's name directly
ALTER TABLE public.titulos 
ADD COLUMN criador text;

-- Update existing titulos with the name from profiles
UPDATE public.titulos t
SET criador = p.nome
FROM public.profiles p
WHERE t.created_by = p.id;

-- Make the column NOT NULL after populating existing data
ALTER TABLE public.titulos 
ALTER COLUMN criador SET NOT NULL;