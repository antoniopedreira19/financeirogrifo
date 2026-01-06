-- Enable REPLICA IDENTITY FULL for titulos_pendentes
ALTER TABLE public.titulos_pendentes REPLICA IDENTITY FULL;

-- Add titulos_pendentes to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.titulos_pendentes;