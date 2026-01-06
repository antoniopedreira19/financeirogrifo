-- Enable REPLICA IDENTITY FULL for complete row data on updates
ALTER TABLE public.titulos REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.titulos;