import { createContext, useContext, useState, ReactNode } from 'react';
import { Obra } from '@/types';
import { useSupabaseAuth, UserProfile } from '@/hooks/useSupabaseAuth';
import { FirstLoginModal } from '@/components/auth/FirstLoginModal';

interface AuthContextType {
  user: UserProfile | null;
  selectedObra: Obra | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signup: (email: string, password: string, nome: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  selectObra: (obra: Obra) => void;
  clearSelectedObra: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { profile, isLoading, signIn, signUp, signOut, refreshProfile, user } = useSupabaseAuth();
  const [selectedObra, setSelectedObra] = useState<Obra | null>(() => {
    const stored = localStorage.getItem('grifo_obra');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, password: string) => {
    const result = await signIn(email, password);
    return result;
  };

  const signup = async (email: string, password: string, nome: string) => {
    const result = await signUp(email, password, nome);
    return { error: result.error };
  };

  const logout = async () => {
    await signOut();
    setSelectedObra(null);
    localStorage.removeItem('grifo_obra');
  };

  const selectObra = (obra: Obra) => {
    setSelectedObra(obra);
    localStorage.setItem('grifo_obra', JSON.stringify(obra));
  };

  const clearSelectedObra = () => {
    setSelectedObra(null);
    localStorage.removeItem('grifo_obra');
  };

  const handleFirstLoginComplete = () => {
    refreshProfile();
  };

  // Check if user needs to complete first login
  const showFirstLoginModal = profile && !profile.perfilCompleto && user;

  return (
    <AuthContext.Provider
      value={{
        user: profile,
        selectedObra,
        isLoading,
        login,
        signup,
        logout,
        selectObra,
        clearSelectedObra,
      }}
    >
      {children}
      
      {showFirstLoginModal && (
        <FirstLoginModal
          open={true}
          userId={profile.id}
          currentNome={profile.nome}
          onComplete={handleFirstLoginComplete}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
