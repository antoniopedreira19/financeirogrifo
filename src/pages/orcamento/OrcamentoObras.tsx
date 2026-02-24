import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, MapPin, Hash, CheckCircle, Loader2, Pencil } from "lucide-react";
import { Obra } from "@/types";
import { EtapasManager } from "@/components/admin/EtapasManager";
import { useAuth } from "@/contexts/AuthContext";

export default function OrcamentoObras() {
  const { user } = useAuth();
  const obras = user?.obras || [];
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);

  const openEditDialog = (obra: Obra) => {
    setEditingObra({ ...obra });
    setIsEditDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Obras</h1>
          <p className="text-muted-foreground mt-1">Gerencie as etapas das obras</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {obras.map((obra) => (
            <div key={obra.id} className="card-elevated p-5">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-accent/10">
                  <Building2 className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{obra.nome}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Hash className="h-4 w-4" />
                        <span className="font-mono">{obra.codigo}</span>
                      </div>
                    </div>
                    {obra.ativa && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-success/10 text-success">
                        <CheckCircle className="h-3 w-3" />
                        Ativa
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{obra.endereco}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(obra)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar Etapas
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {obras.length === 0 && (
          <div className="card-elevated p-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma obra vinculada</h3>
            <p className="text-muted-foreground">Solicite ao administrador para vincular obras ao seu usuário.</p>
          </div>
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Etapas - {editingObra?.nome}</DialogTitle>
          </DialogHeader>
          {editingObra && (
            <div className="mt-4">
              <EtapasManager obraId={editingObra.id} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
