import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useObrasQuery } from "@/hooks/useObrasQuery";
import { UserRole, Obra } from "@/types";
import { Plus, Users, Building2, Mail, Shield, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface UserDisplay {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  obras: Obra[];
}

const DEFAULT_PASSWORD = "@Grifo2026";

export default function AdminUsuarios() {
  const { data: obras = [], isLoading: loadingObras } = useObrasQuery();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDisplay | null>(null);
  const [newUser, setNewUser] = useState({
    nome: "",
    email: "",
    role: "obra" as UserRole,
    obraIds: [] as string[],
  });
  const [editUser, setEditUser] = useState({
    nome: "",
    role: "obra" as UserRole,
    obraIds: [] as string[],
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase.from("profiles").select("*").order("nome");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase.from("user_roles").select("*");

      if (rolesError) throw rolesError;

      const { data: userObras, error: userObrasError } = await supabase.from("user_obras").select(`user_id, obras (*)`);

      if (userObrasError) throw userObrasError;

      return (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.id);
        const userObrasList = (userObras || [])
          .filter((uo) => uo.user_id === profile.id && uo.obras)
          .map((uo) => {
            const o = uo.obras as any;
            return {
              id: o.id,
              nome: o.nome,
              codigo: o.codigo,
              endereco: o.endereco || "",
              ativa: o.ativa,
              createdAt: new Date(o.created_at),
            } as Obra;
          });

        return {
          id: profile.id,
          nome: profile.nome,
          email: profile.email,
          role: (userRole?.role as UserRole) || "obra",
          obras: userObrasList,
        } as UserDisplay;
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: { nome: string; email: string; role: UserRole; obraIds: string[] }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error("Sessão não encontrada");
      }

      const response = await fetch(
        "https://epphcvlytxhemhiqgiir.supabase.co/functions/v1/create-user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: userData.email,
            password: DEFAULT_PASSWORD,
            nome: userData.nome,
            role: userData.role,
            obraIds: userData.obraIds,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao criar usuário");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setNewUser({ nome: "", email: "", role: "obra", obraIds: [] });
      setIsDialogOpen(false);
      toast.success("Usuário criado com sucesso!", {
        description: `Senha padrão: ${DEFAULT_PASSWORD}`,
      });
    },
    onError: (error: any) => {
      console.error("Error creating user:", error);
      let message = "Erro ao criar usuário";
      if (error.message?.includes("already registered") || error.message?.includes("already been registered")) {
        message = "Este email já está cadastrado.";
      } else if (error.message) {
        message = error.message;
      }
      toast.error(message);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({
      userId,
      userData,
    }: {
      userId: string;
      userData: { nome: string; role: UserRole; obraIds: string[] };
    }) => {
      // Update profile name
      const { error: profileError } = await supabase.from("profiles").update({ nome: userData.nome }).eq("id", userId);

      if (profileError) throw profileError;

      // Update role - use upsert to handle cases where role doesn't exist
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role: userData.role }, { onConflict: "user_id" });

      if (roleError) throw roleError;

      // Get current obras
      const { data: currentObras } = await supabase.from("user_obras").select("obra_id").eq("user_id", userId);

      const currentObraIds = (currentObras || []).map((o) => o.obra_id);
      const newObraIds = userData.obraIds;

      // Delete removed obras
      const obrasToRemove = currentObraIds.filter((id) => !newObraIds.includes(id));
      if (obrasToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("user_obras")
          .delete()
          .eq("user_id", userId)
          .in("obra_id", obrasToRemove);

        if (deleteError) throw deleteError;
      }

      // Add new obras
      const obrasToAdd = newObraIds.filter((id) => !currentObraIds.includes(id));
      if (obrasToAdd.length > 0) {
        const obraInserts = obrasToAdd.map((obraId) => ({
          user_id: userId,
          obra_id: obraId,
        }));

        const { error: insertError } = await supabase.from("user_obras").insert(obraInserts);
        if (insertError) throw insertError;
      }

      return { userId, userData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      toast.success("Usuário atualizado com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error updating user:", error);
      toast.error("Erro ao atualizar usuário");
    },
  });

  const handleCreateUser = () => {
    if (!newUser.nome || !newUser.email) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const handleEditUser = (user: UserDisplay) => {
    setEditingUser(user);
    setEditUser({
      nome: user.nome,
      role: user.role,
      obraIds: user.obras.map((o) => o.id),
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editingUser || !editUser.nome) {
      toast.error("Preencha o nome do usuário");
      return;
    }
    updateUserMutation.mutate({ userId: editingUser.id, userData: editUser });
  };

  const isLoading = loadingUsers || loadingObras;

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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Usuários</h1>
            <p className="text-muted-foreground mt-1">Gerencie os usuários do sistema</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold">
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={newUser.nome}
                    onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                    className="input-field"
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="input-field"
                    placeholder="email@grifo.com"
                  />
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Senha padrão:</strong> {DEFAULT_PASSWORD}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    O usuário deverá completar o cadastro no primeiro login.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Usuário</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: UserRole) => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger className="input-field">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="obra">Equipe de Obra</SelectItem>
                      <SelectItem value="orcamento">Orçamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newUser.role === "obra" && (
                  <div className="space-y-2">
                    <Label>Obras Vinculadas</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {obras.map((obra) => (
                        <label
                          key={obra.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={newUser.obraIds.includes(obra.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewUser({ ...newUser, obraIds: [...newUser.obraIds, obra.id] });
                              } else {
                                setNewUser({
                                  ...newUser,
                                  obraIds: newUser.obraIds.filter((id) => id !== obra.id),
                                });
                              }
                            }}
                            className="rounded border-border"
                          />
                          <div>
                            <p className="font-medium text-sm">{obra.nome}</p>
                            <p className="text-xs text-muted-foreground">{obra.codigo}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <Button
                  variant="gold"
                  className="w-full"
                  onClick={handleCreateUser}
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Usuário"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nome">Nome</Label>
                  <Input
                    id="edit-nome"
                    value={editUser.nome}
                    onChange={(e) => setEditUser({ ...editUser, nome: e.target.value })}
                    className="input-field"
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={editingUser.email} disabled className="input-field bg-muted" />
                  <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Usuário</Label>
                  <Select
                    value={editUser.role}
                    onValueChange={(value: UserRole) => setEditUser({ ...editUser, role: value })}
                  >
                    <SelectTrigger className="input-field">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="obra">Equipe de Obra</SelectItem>
                      <SelectItem value="orcamento">Orçamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editUser.role === "obra" && (
                  <div className="space-y-2">
                    <Label>Obras Vinculadas</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {obras.map((obra) => (
                        <label
                          key={obra.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={editUser.obraIds.includes(obra.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditUser({ ...editUser, obraIds: [...editUser.obraIds, obra.id] });
                              } else {
                                setEditUser({
                                  ...editUser,
                                  obraIds: editUser.obraIds.filter((id) => id !== obra.id),
                                });
                              }
                            }}
                            className="rounded border-border"
                          />
                          <div>
                            <p className="font-medium text-sm">{obra.nome}</p>
                            <p className="text-xs text-muted-foreground">{obra.codigo}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <Button
                  variant="gold"
                  className="w-full"
                  onClick={handleUpdateUser}
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? (
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {users.map((user) => (
            <div key={user.id} className="card-elevated p-5">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-accent/10">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{user.nome}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)} className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${
                          user.role === "admin" ? "bg-primary/10 text-primary" : user.role === "orcamento" ? "bg-warning/10 text-warning" : "bg-accent/10 text-accent"
                        }`}
                      >
                        <Shield className="h-3 w-3" />
                        {user.role === "admin" ? "Admin" : user.role === "orcamento" ? "Orçamento" : "Obra"}
                      </span>
                    </div>
                  </div>
                  {user.role === "obra" && user.obras.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span className="truncate">{user.obras.map((o) => o.nome).join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="card-elevated p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
            <p className="text-muted-foreground">Clique em "Novo Usuário" para cadastrar o primeiro.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
