-- Add descontos column to titulos table
ALTER TABLE public.titulos 
ADD COLUMN descontos numeric DEFAULT 0;