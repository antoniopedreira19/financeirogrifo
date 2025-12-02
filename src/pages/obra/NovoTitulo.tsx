import { AppLayout } from '@/components/layout/AppLayout';
import { TituloForm } from '@/components/titulos/TituloForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function NovoTitulo() {
  const navigate = useNavigate();

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
              Novo Título
            </h1>
            <p className="text-muted-foreground mt-1">
              Preencha as informações do título financeiro
            </p>
          </div>
        </div>

        {/* Form */}
        <TituloForm />
      </div>
    </AppLayout>
  );
}
