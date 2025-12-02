import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Obra } from '@/types';

export function useObrasQuery() {
  return useQuery({
    queryKey: ['obras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obras')
        .select('*')
        .eq('ativa', true)
        .order('nome');

      if (error) {
        console.error('Error fetching obras:', error);
        throw error;
      }

      return (data || []).map(o => ({
        id: o.id,
        nome: o.nome,
        codigo: o.codigo,
        endereco: o.endereco || '',
        ativa: o.ativa,
        grupoId: o.grupo_id || undefined,
        createdAt: new Date(o.created_at),
      })) as Obra[];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
}

export function useObraById(obraId: string | undefined) {
  return useQuery({
    queryKey: ['obras', obraId],
    queryFn: async () => {
      if (!obraId) return null;

      const { data, error } = await supabase
        .from('obras')
        .select('*')
        .eq('id', obraId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching obra:', error);
        throw error;
      }

      if (!data) return null;

      return {
        id: data.id,
        nome: data.nome,
        codigo: data.codigo,
        endereco: data.endereco || '',
        ativa: data.ativa,
        grupoId: data.grupo_id || undefined,
        createdAt: new Date(data.created_at),
      } as Obra;
    },
    enabled: !!obraId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
}
