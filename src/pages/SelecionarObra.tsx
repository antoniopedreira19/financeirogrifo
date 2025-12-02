import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, ArrowRight, LogOut, Loader2 } from 'lucide-react';
import { Obra } from '@/types';

export default function SelecionarObra() {
  const { user, selectObra, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  // User's obras come from the auth context
  const userObras = user?.obras || [];

  const handleSelectObra = (obra: Obra) => {
    selectObra(obra);
    navigate('/obra/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Logo size="md" />
          <Button variant="ghost" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Welcome */}
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Olá, {user?.nome}!
          </h1>
          <p className="text-muted-foreground text-lg">
            Selecione a obra que deseja acessar
          </p>
        </div>

        {/* Obras Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {userObras.map((obra, index) => (
            <button
              key={obra.id}
              onClick={() => handleSelectObra(obra)}
              className="card-elevated p-6 text-left hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <Building2 className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg mb-1">
                        {obra.nome}
                      </h3>
                      <p className="text-sm text-muted-foreground font-mono">
                        {obra.codigo}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{obra.endereco}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {userObras.length === 0 && (
          <div className="text-center py-12 card-elevated">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma obra vinculada</h3>
            <p className="text-muted-foreground">
              Entre em contato com o administrador para vincular obras ao seu usuário.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
