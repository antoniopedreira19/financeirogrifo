import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, Obra } from '@/types';

export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  obras: Obra[];
  telefone?: string;
  perfilCompleto: boolean;
}

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching role:', roleError);
      }

      const role: UserRole = (roleData?.role as UserRole) || 'obra';

      let obras: Obra[] = [];
      
      if (role === 'admin') {
        const { data: obrasData, error: obrasError } = await supabase
          .from('obras')
          .select('*')
          .eq('ativa', true)
          .order('nome');

        if (obrasError) {
          console.error('Error fetching obras:', obrasError);
        } else {
          obras = (obrasData || []).map(o => ({
            id: o.id,
            nome: o.nome,
            codigo: o.codigo,
            endereco: o.endereco || '',
            ativa: o.ativa,
            createdAt: new Date(o.created_at),
          }));
        }
      } else {
        const { data: userObrasData, error: userObrasError } = await supabase
          .from('user_obras')
          .select(`obra_id, obras (*)`)
          .eq('user_id', userId);

        if (userObrasError) {
          console.error('Error fetching user obras:', userObrasError);
        } else {
          obras = (userObrasData || [])
            .filter(uo => uo.obras)
            .map(uo => {
              const o = uo.obras as any;
              return {
                id: o.id,
                nome: o.nome,
                codigo: o.codigo,
                endereco: o.endereco || '',
                ativa: o.ativa,
                createdAt: new Date(o.created_at),
              };
            });
        }
      }

      return {
        id: profileData?.id || userId,
        nome: profileData?.nome || '',
        email: profileData?.email || '',
        role,
        obras,
        telefone: (profileData as any)?.telefone || undefined,
        perfilCompleto: (profileData as any)?.perfil_completo || false,
      };
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id).then(setProfile);
          }, 0);
        } else {
          setProfile(null);
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id).then((p) => {
          setProfile(p);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    if (data.user) {
      const userProfile = await fetchUserProfile(data.user.id);
      setProfile(userProfile);
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string, nome: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { nome },
      },
    });

    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setProfile(null);
      setUser(null);
      setSession(null);
    }
    return { error };
  };

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await fetchUserProfile(user.id);
      setProfile(userProfile);
    }
  };

  return {
    user,
    session,
    profile,
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };
}
