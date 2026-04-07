import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ROLE_LABELS, getLimiteFormatado } from "@/constants/aprovacao";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useObrasQuery } from "@/hooks/useObrasQuery";
import { UserRole, Obra } from "@/types";
import { Plus, Users, Building2, Mail, Shield, Loader2, Pencil, Info, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface UserDisplay {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  obras: Obra[];
}

const DEFAULT_PASSWORD = "@Grifo2026";

const ROLE_COLOR_MAP: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  obra: "bg-accent/10 text-accent border-accent/20",
  orcamento: "bg-warning/10 text-warning border-warning/20",
  engenheiro_assistente: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  engenheiro: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20",
  diretor_obra: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  diretor: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
};

const ALCADA_TABLE: { role: UserRole; label: string; limite: string }[] = [
  { role: "engenheiro_assistente", label: "Eng. Assistente", limite: "Até R$ 1.000" },
  { role: "engenheiro", label: "Engenheiro", limite: "Até R$ 10.000" },
  { role: "diretor_obra", label: "Diretor de Obra", limite: "Até R$ 50.000" },
  { role: "diretor", label: "Diretor", limite: "Sem limite" },
  { role: "admin", label: "Administrador", limite: "Sem limite (super-role)" },
];

export default function AdminUsuarios() {
  const { data: obras = [], isLoading: loadingObras } = useObrasQuery();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDisplay | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
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

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: { nome: string; email: string; role: UserRole; obraIds: string[] }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Sessão não encontrada");

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
      if (!response.ok) throw new Error(result.error || "Erro ao criar usuário");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setNewUser({ nome: "", email: "", role: "obra", obraIds: [] });
      setIsDialogOpen(false);
      toast.success("Usuário criado com sucesso!", { description: `Senha padrão: ${DEFAULT_PASSWORD}` });
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
      const { error: profileError } = await supabase.from("profiles").update({ nome: userData.nome }).eq("id", userId);
      if (profileError) throw profileError;

      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role: userData.role }, { onConflict: "user_id" });
      if (roleError) throw roleError;

      const { data: currentObras } = await supabase.from("user_obras").select("obra_id").eq("user_id", userId);
      const currentObraIds = (currentObras || []).map((o) => o.obra_id);
      const newObraIds = userData.obraIds;

      const obrasToRemove = currentObraIds.filter((id) => !newObraIds.includes(id));
      if (obrasToRemove.length > 0) {
        const { error: deleteError } = await supabase.from("user_obras").delete().eq("user_id", userId).in("obra_id", obrasToRemove);
        if (deleteError) throw deleteError;
      }

      const obrasToAdd = newObraIds.filter((id) => !currentObraIds.includes(id));
      if (obrasToAdd.length > 0) {
        const { error: insertError } = await supabase.from("user_obras").insert(obrasToAdd.map((obraId) => ({ user_id: userId, obra_id: obraId })));
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
    setEditUser({ nome: user.nome, role: user.role, obraIds: user.obras.map((o) => o.id) });
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

  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const RoleSelectItems = () => (
    <>
      <SelectItem value="admin">Administrador</SelectItem>
      <SelectItem value="obra">Equipe de Obra</SelectItem>
      <SelectItem value="orcamento">Orçamento</SelectItem>
      <SelectItem value="engenheiro_assistente">Eng. Assistente</SelectItem>
      <SelectItem value="engenheiro">Engenheiro</SelectItem>
      <SelectItem value="diretor_obra">Diretor de Obra</SelectItem>
      <SelectItem value="diretor">Diretor</SelectItem>
    </>
  );

  const ObrasChecklist = ({
    selectedIds,
    onChange,
  }: {
    selectedIds: string[];
    onChange: (ids: string[]) => void;
  }) => (
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
              checked={selectedIds.includes(obra.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange([...selectedIds, obra.id]);
                } else {
                  onChange(selectedIds.filter((id) => id !== obra.id));
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
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Usuários</h1>
            <p className="text-muted-foreground mt-1">
              {users.length} usuário{users.length !== 1 ? "s" : ""} cadastrado{users.length !== 1 ? "s" : ""}
            </p>
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
                      <RoleSelectItems />
                    </SelectContent>
                  </Select>
                  {/* Alçada hint */}
                  {["engenheiro_assistente", "engenheiro", "diretor_obra", "diretor", "admin"].includes(newUser.role) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Alçada: {getLimiteFormatado(newUser.role)}
                    </p>
                  )}
                </div>
                {newUser.role !== "admin" && (
                  <ObrasChecklist
                    selectedIds={newUser.obraIds}
                    onChange={(ids) => setNewUser({ ...newUser, obraIds: ids })}
                  />
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

        {/* Alçada Reference Card */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center gap-2 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left">
              <Info className="h-4 w-4 text-accent shrink-0" />
              <span className="text-sm font-medium text-foreground">Referência de Alçadas e Permissões</span>
              <span className="text-xs text-muted-foreground ml-auto">Clique para expandir</span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 rounded-lg border border-border bg-card p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-semibold text-foreground">Role</th>
                      <th className="text-left py-2 pr-4 font-semibold text-foreground">Alçada (Aprovar + Pagar)</th>
                      <th className="text-left py-2 font-semibold text-foreground">Permissões</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ALCADA_TABLE.map(({ role, label, limite }) => (
                      <tr key={role} className="border-b border-border/50 last:border-0">
                        <td className="py-2 pr-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${ROLE_COLOR_MAP[role] || "bg-muted text-muted-foreground"}`}>
                            {label}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">{limite}</td>
                        <td className="py-2 text-muted-foreground">Aprovar, Pagar (Manual + Asaas)</td>
                      </tr>
                    ))}
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${ROLE_COLOR_MAP.obra}`}>
                          Equipe de Obra
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">—</td>
                      <td className="py-2 text-muted-foreground">Lançar títulos</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${ROLE_COLOR_MAP.orcamento}`}>
                          Orçamento
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">—</td>
                      <td className="py-2 text-muted-foreground">Gerenciar etapas e centros de custo</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="input-field w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as roles ({users.length})</SelectItem>
              <SelectItem value="admin">Administrador ({roleCounts.admin || 0})</SelectItem>
              <SelectItem value="obra">Equipe de Obra ({roleCounts.obra || 0})</SelectItem>
              <SelectItem value="orcamento">Orçamento ({roleCounts.orcamento || 0})</SelectItem>
              <SelectItem value="engenheiro_assistente">Eng. Assistente ({roleCounts.engenheiro_assistente || 0})</SelectItem>
              <SelectItem value="engenheiro">Engenheiro ({roleCounts.engenheiro || 0})</SelectItem>
              <SelectItem value="diretor_obra">Diretor de Obra ({roleCounts.diretor_obra || 0})</SelectItem>
              <SelectItem value="diretor">Diretor ({roleCounts.diretor || 0})</SelectItem>
            </SelectContent>
          </Select>
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
                      <RoleSelectItems />
                    </SelectContent>
                  </Select>
                  {["engenheiro_assistente", "engenheiro", "diretor_obra", "diretor", "admin"].includes(editUser.role) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Alçada: {getLimiteFormatado(editUser.role)}
                    </p>
                  )}
                </div>
                {editUser.role !== "admin" && (
                  <ObrasChecklist
                    selectedIds={editUser.obraIds}
                    onChange={(ids) => setEditUser({ ...editUser, obraIds: ids })}
                  />
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

        {/* User Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="card-elevated p-5 group">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-accent">
                    {user.nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{user.nome}</h3>
                      <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditUser(user)}
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_COLOR_MAP[user.role] || "bg-muted text-muted-foreground border-border"}`}
                      >
                        <Shield className="h-3 w-3" />
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </div>
                  </div>
                  {user.role !== "admin" && user.obras.length > 0 && (
                    <div className="flex items-center gap-2 mt-2.5 text-sm text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{user.obras.map((o) => o.nome).join(", ")}</span>
                    </div>
                  )}
                  {["engenheiro_assistente", "engenheiro", "diretor_obra", "diretor"].includes(user.role) && (
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <Shield className="h-3 w-3 shrink-0" />
                      <span>Alçada: {getLimiteFormatado(user.role)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="card-elevated p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || filterRole !== "all" ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm || filterRole !== "all"
                ? "Tente ajustar os filtros de busca."
                : 'Clique em "Novo Usuário" para cadastrar o primeiro.'}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
