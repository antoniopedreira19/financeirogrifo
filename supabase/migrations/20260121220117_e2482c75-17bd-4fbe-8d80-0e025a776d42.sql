-- Add column to control if obra allows titles without obra appropriation
ALTER TABLE public.obras 
ADD COLUMN permite_sem_apropriacao boolean NOT NULL DEFAULT false;

-- Add comment to document the column
COMMENT ON COLUMN public.obras.permite_sem_apropriacao IS 'Quando true, permite lançar títulos sem apropriação por obra no Sienge (omitindo buildingsCost)';