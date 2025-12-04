import { AppLayout } from '@/components/layout/AppLayout';
import { TituloForm } from '@/components/titulos/TituloForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { Titulo } from '@/types';

export default function NovoTitulo() {
  const navigate = useNavigate();
  const location = useLocation();
  const tituloToReplicate = (location.state as { tituloToReplicate?: Titulo })?.tituloToReplicate;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              {tituloToReplicate ? 'Replicar Título' : 'Novo Título'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {tituloToReplicate 
                ? 'Revise e ajuste as informações do título replicado'
                : 'Preencha as informações do título financeiro'}
            </p>
          </div>
        </div>

        {/* Form */}
        <TituloForm initialData={tituloToReplicate} />
      </div>
    </AppLayout>
  );
}
