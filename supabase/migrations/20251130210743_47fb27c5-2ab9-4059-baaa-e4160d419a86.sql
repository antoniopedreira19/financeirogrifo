-- Add foreign key constraint from titulos_pendentes to obras
ALTER TABLE public.titulos_pendentes
ADD CONSTRAINT titulos_pendentes_obra_id_fkey
FOREIGN KEY (obra_id) REFERENCES public.obras(id);