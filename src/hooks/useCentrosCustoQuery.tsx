import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ObraCentroCusto {
  id: string;
  obra_id: string;
  codigo: string;
  created_at: string;
}

export function useCentrosCustoByObra(obraId: string | undefined) {
  return useQuery({
    queryKey: ['obra_centros_custo', obraId],
    queryFn: async () => {
      if (!obraId) return [];
      const { data, error } = await supabase
        .from('obra_centros_custo' as any)
        .select('*')
        .eq('obra_id', obraId)
        .order('codigo');

      if (error) throw error;
      return (data || []) as unknown as ObraCentroCusto[];
    },
    enabled: !!obraId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateCentroCusto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ obraId, codigo }: { obraId: string; codigo: string }) => {
      const { data, error } = await supabase
        .from('obra_centros_custo' as any)
        .insert({ obra_id: obraId, codigo } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['obra_centros_custo', variables.obraId] });
    },
  });
}

export function useDeleteCentroCusto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, obraId }: { id: string; obraId: string }) => {
      const { error } = await supabase
        .from('obra_centros_custo' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['obra_centros_custo', variables.obraId] });
    },
  });
}
