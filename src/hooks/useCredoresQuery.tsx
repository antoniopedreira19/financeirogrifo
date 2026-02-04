import { useMemo } from 'react';
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

const PAGE_SIZE = 1000;

// Fetch all credores with pagination (to bypass 1000 row limit)
async function fetchAllCredores(): Promise<Credor[]> {
  const allCredores: Credor[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('sienge_credores')
      .select('id, creditor_id, nome, nome_fantasia, doc, tipo')
      .order('nome', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('Error fetching credores page:', page, error);
      throw error;
    }

    if (data && data.length > 0) {
      allCredores.push(...(data as Credor[]));
      // If we got less than PAGE_SIZE, we've reached the end
      hasMore = data.length === PAGE_SIZE;
      page++;
    } else {
      hasMore = false;
    }
  }

  console.info(`[useCredoresQuery] Total credores loaded: ${allCredores.length}`);
  return allCredores;
}

// Fetch all credores (cached)
export function useCredoresQuery() {
  return useQuery({
    queryKey: ['sienge_credores', 'v2'], // Bumped version to force refetch
    queryFn: fetchAllCredores,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    gcTime: 1000 * 60 * 60, // Keep in garbage collection for 1 hour
  });
}

function stripAccentsLower(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Loose normalization: remove punctuation (helps with "f&s" -> "f s")
function normalizeTextLoose(text: string): string {
  return stripAccentsLower(text)
    .replace(/[^\w\s]/gi, ' ') // Replace punctuation with space
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
}

// Strict normalization: keep punctuation (helps with "F &" matching "F & S ...")
function normalizeTextStrict(text: string): string {
  return stripAccentsLower(text)
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
}

// Hook for filtering credores with improved matching
export function useCredoresFilter(searchTerm: string) {
  const { data: allCredores = [], isLoading } = useCredoresQuery();

  const rawSearch = searchTerm.trim();
  const looseSearch = normalizeTextLoose(rawSearch);
  const strictSearch = normalizeTextStrict(rawSearch);
  
  const filteredCredores = useMemo(() => {
    // IMPORTANT: check the raw input length, not the normalized one.
    // Example: "F &" becomes "f" in loose mode, but should still search.
    if (!rawSearch || rawSearch.length < 2) {
      return [];
    }

    const useLoose = looseSearch.length >= 2;
    const useStrict = strictSearch.length >= 2;
    
    // Also prepare numeric-only version for doc search
    const numericSearch = searchTerm.replace(/\D/g, '');
    
    const results = allCredores.filter(credor => {
      const nome = credor.nome || '';
      const fantasia = credor.nome_fantasia || '';

      const looseMatch =
        useLoose &&
        (normalizeTextLoose(nome).includes(looseSearch) ||
          normalizeTextLoose(fantasia).includes(looseSearch));

      const strictMatch =
        useStrict &&
        (normalizeTextStrict(nome).includes(strictSearch) ||
          normalizeTextStrict(fantasia).includes(strictSearch));
      
      // Search in document (numbers only)
      const docMatch = numericSearch.length > 0 && credor.doc?.replace(/\D/g, '').includes(numericSearch);
      
      return strictMatch || looseMatch || docMatch;
    });
    
    return results.slice(0, 50); // Limit to 50 results for performance
  }, [allCredores, looseSearch, rawSearch, searchTerm, strictSearch]);

  return {
    credores: filteredCredores,
    isLoading,
    totalCount: allCredores.length,
  };
}
