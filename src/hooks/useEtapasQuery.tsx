import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ObraEtapa {
  id: string;
  obraId: string;
  codigo: string;
  nome: string;
  createdAt: Date;
}

export function useEtapasByObra(obraId: string | undefined) {
  return useQuery({
    queryKey: ['obra-etapas', obraId],
    queryFn: async () => {
      if (!obraId) return [];

      const { data, error } = await supabase
        .from('obra_etapas')
        .select('*')
        .eq('obra_id', obraId)
        .order('codigo');

      if (error) {
        console.error('Error fetching etapas:', error);
        throw error;
      }

      return (data || []).map(e => ({
        id: e.id,
        obraId: e.obra_id,
        codigo: e.codigo,
        nome: e.nome,
        createdAt: new Date(e.created_at),
      })) as ObraEtapa[];
    },
    enabled: !!obraId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (etapa: { obraId: string; codigo: string; nome: string }) => {
      const { data, error } = await supabase
        .from('obra_etapas')
        .insert({
          obra_id: etapa.obraId,
          codigo: etapa.codigo,
          nome: etapa.nome,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['obra-etapas', variables.obraId] });
    },
  });
}

export function useDeleteEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ etapaId, obraId }: { etapaId: string; obraId: string }) => {
      const { error } = await supabase
        .from('obra_etapas')
        .delete()
        .eq('id', etapaId);

      if (error) throw error;
      return { obraId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['obra-etapas', data.obraId] });
    },
  });
}

export function useBulkCreateEtapas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ obraId, etapas }: { obraId: string; etapas: { codigo: string; nome: string }[] }) => {
      const insertData = etapas.map(e => ({
        obra_id: obraId,
        codigo: e.codigo,
        nome: e.nome,
      }));

      const { data, error } = await supabase
        .from('obra_etapas')
        .insert(insertData)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['obra-etapas', variables.obraId] });
    },
  });
}
