import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Credor {
  id: string;
  creditor_id: number;
  nome: string;
  nome_fantasia: string | null;
  doc: string | null;
  tipo: string | null; // "F" ou "J"
}

// Fetch all credores (cached)
export function useCredoresQuery() {
  return useQuery({
    queryKey: ['sienge_credores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sienge_credores')
        .select('id, creditor_id, nome, nome_fantasia, doc, tipo')
        .order('nome', { ascending: true })
        .range(0, 9999); // Buscar todos os credores (limite padrão é 1000)

      if (error) {
        console.error('Error fetching credores:', error);
        throw error;
      }

      return (data || []) as Credor[];
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    gcTime: 1000 * 60 * 60, // Keep in garbage collection for 1 hour
  });
}

// Hook for filtering credores with debounce-like behavior in client
export function useCredoresFilter(searchTerm: string) {
  const { data: allCredores = [], isLoading } = useCredoresQuery();
  
  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  const filteredCredores = useMemo(() => {
    if (!normalizedSearch || normalizedSearch.length < 2) {
      return [];
    }
    
    const numericSearch = normalizedSearch.replace(/\D/g, '');
    
    const results = allCredores.filter(credor => {
      // Search in nome
      const nomeMatch = credor.nome?.toLowerCase().includes(normalizedSearch);
      // Search in nome_fantasia
      const fantasiaMatch = credor.nome_fantasia?.toLowerCase().includes(normalizedSearch);
      // Search in document (numbers only)
      const docMatch = numericSearch.length > 0 && credor.doc?.replace(/\D/g, '').includes(numericSearch);
      
      return nomeMatch || fantasiaMatch || docMatch;
    });
    
    return results.slice(0, 50); // Limit to 50 results for performance
  }, [allCredores, normalizedSearch]);

  return {
    credores: filteredCredores,
    isLoading,
    totalCount: allCredores.length,
  };
}
