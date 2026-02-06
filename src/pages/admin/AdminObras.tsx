import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useObrasQuery } from "@/hooks/useObrasQuery";
import { Plus, Building2, MapPin, Hash, CheckCircle, Loader2, Pencil, Trash2, Layers } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Obra } from "@/types";
import { EtapasManager } from "@/components/admin/EtapasManager";
import { useEtapasByObra } from "@/hooks/useEtapasQuery";

export default function AdminObras() {
  const { data: obras = [], isLoading } = useObrasQuery();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteObraId, setDeleteObraId] = useState<string | null>(null);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [newObra, setNewObra] = useState({
    nome: "",
    codigo: "",
    endereco: "",
    grupoId: "",
  });

  const createObraMutation = useMutation({
    mutationFn: async (obraData: { nome: string; codigo: string; endereco: string; grupoId: string }) => {
      // Get user's empresa_id from their profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("empresa_id")
        .eq("id", user.id)
        .single();

      if (!profile?.empresa_id) throw new Error("Empresa não encontrada");

      const { data, error } = await supabase
        .from("obras")
        .insert({
          nome: obraData.nome,
          codigo: obraData.codigo,
          endereco: obraData.endereco,
          grupo_id: obraData.grupoId || null,
          ativa: true,
          empresa_id: profile.empresa_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obras"] });
      setNewObra({ nome: "", codigo: "", endereco: "", grupoId: "" });
      setIsCreateDialogOpen(false);
      toast.success("Obra criada com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error creating obra:", error);
      toast.error(error.message || "Erro ao criar obra");
    },
  });

  const updateObraMutation = useMutation({
    mutationFn: async (obraData: { id: string; nome: string; codigo: string; endereco: string; grupoId?: string; ativa: boolean; permiteSemApropriacao: boolean; ocultarCodigoObra: boolean }) => {
      const { data, error } = await supabase
        .from("obras")
        .update({
          nome: obraData.nome,
          codigo: obraData.codigo,
          endereco: obraData.endereco,
          grupo_id: obraData.grupoId || null,
          ativa: obraData.ativa,
          permite_sem_apropriacao: obraData.permiteSemApropriacao,
          ocultar_codigo_obra: obraData.ocultarCodigoObra,
        })
        .eq("id", obraData.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obras"] });
      setEditingObra(null);
      setIsEditDialogOpen(false);
      toast.success("Obra atualizada com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error updating obra:", error);
      toast.error(error.message || "Erro ao atualizar obra");
    },
  });

  const deleteObraMutation = useMutation({
    mutationFn: async (obraId: string) => {
      const { error } = await supabase
        .from("obras")
        .delete()
        .eq("id", obraId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obras"] });
      setDeleteObraId(null);
      toast.success("Obra excluída com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error deleting obra:", error);
      toast.error(error.message || "Erro ao excluir obra. Verifique se não há títulos vinculados.");
    },
  });

  const handleCreateObra = () => {
    if (!newObra.nome || !newObra.codigo || !newObra.endereco) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createObraMutation.mutate(newObra);
  };

  const handleEditObra = () => {
    if (!editingObra || !editingObra.nome || !editingObra.codigo || !editingObra.endereco) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    updateObraMutation.mutate({
      id: editingObra.id,
      nome: editingObra.nome,
      codigo: editingObra.codigo,
      endereco: editingObra.endereco,
      grupoId: editingObra.grupoId,
      ativa: editingObra.ativa,
      permiteSemApropriacao: editingObra.permiteSemApropriacao || false,
      ocultarCodigoObra: editingObra.ocultarCodigoObra || false,
    });
  };

  const openEditDialog = (obra: Obra) => {
    setEditingObra({ ...obra });
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Obras</h1>
            <p className="text-muted-foreground mt-1">Gerencie as obras do sistema</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold">
                <Plus className="h-4 w-4 mr-2" />
                Nova Obra
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Nova Obra</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Obra</Label>
                  <Input
                    id="nome"
                    value={newObra.nome}
                    onChange={(e) => setNewObra({ ...newObra, nome: e.target.value })}
                    className="input-field"
                    placeholder="Ex: Fly51"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    value={newObra.codigo}
                    onChange={(e) => setNewObra({ ...newObra, codigo: e.target.value })}
                    className="input-field"
                    placeholder="Ex: 211"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={newObra.endereco}
                    onChange={(e) => setNewObra({ ...newObra, endereco: e.target.value })}
                    className="input-field"
                    placeholder="Porto Alegre"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grupoId">ID do Grupo (UAZAPI)</Label>
                  <Input
                    id="grupoId"
                    value={newObra.grupoId}
                    onChange={(e) => setNewObra({ ...newObra, grupoId: e.target.value })}
                    className="input-field"
                    placeholder="Ex: 120363321683748777@g.us"
                  />
                </div>
                <Button
                  variant="gold"
                  className="w-full"
                  onClick={handleCreateObra}
                  disabled={createObraMutation.isPending}
                >
                  {createObraMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Obra"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Obras Grid */}
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
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteObraId(obra.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
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
            <h3 className="text-lg font-semibold mb-2">Nenhuma obra cadastrada</h3>
            <p className="text-muted-foreground">Clique em "Nova Obra" para cadastrar a primeira.</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Obra</DialogTitle>
          </DialogHeader>
          {editingObra && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome da Obra</Label>
                <Input
                  id="edit-nome"
                  value={editingObra.nome}
                  onChange={(e) => setEditingObra({ ...editingObra, nome: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-codigo">Código</Label>
                <Input
                  id="edit-codigo"
                  value={editingObra.codigo}
                  onChange={(e) => setEditingObra({ ...editingObra, codigo: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endereco">Endereço</Label>
                <Input
                  id="edit-endereco"
                  value={editingObra.endereco}
                  onChange={(e) => setEditingObra({ ...editingObra, endereco: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-grupoId">ID do Grupo (UAZAPI)</Label>
                <Input
                  id="edit-grupoId"
                  value={editingObra.grupoId || ""}
                  onChange={(e) => setEditingObra({ ...editingObra, grupoId: e.target.value })}
                  className="input-field"
                  placeholder="Ex: 120363321683748777@g.us"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-ativa"
                  checked={editingObra.ativa}
                  onChange={(e) => setEditingObra({ ...editingObra, ativa: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="edit-ativa">Obra Ativa</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-permite-sem-apropriacao"
                  checked={editingObra.permiteSemApropriacao || false}
                  onChange={(e) => setEditingObra({ ...editingObra, permiteSemApropriacao: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="edit-permite-sem-apropriacao">Permitir lançar títulos sem apropriação por obra</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-ocultar-codigo-obra"
                  checked={editingObra.ocultarCodigoObra || false}
                  onChange={(e) => setEditingObra({ ...editingObra, ocultarCodigoObra: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="edit-ocultar-codigo-obra">Ocultar código da obra (lançar sem apropriação e sem etapas)</Label>
              </div>

              {/* Etapas Manager */}
              <div className="border-t border-border pt-4">
                <EtapasManager obraId={editingObra.id} />
              </div>

              <Button
                variant="gold"
                className="w-full"
                onClick={handleEditObra}
                disabled={updateObraMutation.isPending}
              >
                {updateObraMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteObraId} onOpenChange={() => setDeleteObraId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Obra</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta obra? Esta ação não pode ser desfeita.
              Se houver títulos vinculados a esta obra, a exclusão não será permitida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteObraId && deleteObraMutation.mutate(deleteObraId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteObraMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
