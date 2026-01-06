import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useTitulosRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('[Realtime] Subscribing to titulos changes...');

    // Subscribe to titulos table changes
    const titulosChannel = supabase
      .channel('titulos-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'titulos',
        },
        (payload) => {
          console.log('[Realtime] titulos change:', payload.eventType, payload);
          queryClient.invalidateQueries({ queryKey: ['titulos'] });
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] titulos subscription status:', status);
      });

    // Subscribe to titulos_pendentes table changes
    const pendentesChannel = supabase
      .channel('titulos-pendentes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'titulos_pendentes',
        },
        (payload) => {
          console.log('[Realtime] titulos_pendentes change:', payload.eventType, payload);
          queryClient.invalidateQueries({ queryKey: ['titulos_pendentes'] });
          queryClient.invalidateQueries({ queryKey: ['titulos'] });
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] titulos_pendentes subscription status:', status);
      });

    return () => {
      console.log('[Realtime] Unsubscribing from titulos channels...');
      supabase.removeChannel(titulosChannel);
      supabase.removeChannel(pendentesChannel);
    };
  }, [queryClient]);
}
