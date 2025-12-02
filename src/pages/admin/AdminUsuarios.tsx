import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useObrasQuery } from '@/hooks/useObrasQuery';
import { UserRole, Obra } from '@/types';
import { Plus, Users, Building2, Mail, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UserDisplay {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  obras: Obra[];
}

const DEFAULT_PASSWORD = '@Grifo2025';

export default function AdminUsuarios() {
  const { data: obras = [], isLoading: loadingObras } = useObrasQuery();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    nome: '',
    email: '',
    role: 'obra' as UserRole,
    obraIds: [] as string[],
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('nome');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      const { data: userObras, error: userObrasError } = await supabase
        .from('user_obras')
        .select(`user_id, obras (*)`);

      if (userObrasError) throw userObrasError;

      return (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        const userObrasList = (userObras || [])
          .filter(uo => uo.user_id === profile.id && uo.obras)
          .map(uo => {
            const o = uo.obras as any;
            return {
              id: o.id,
              nome: o.nome,
              codigo: o.codigo,
              endereco: o.endereco || '',
              ativa: o.ativa,
              createdAt: new Date(o.created_at),
            } as Obra;
          });

        return {
          id: profile.id,
          nome: profile.nome,
          email: profile.email,
          role: (userRole?.role as UserRole) || 'obra',
          obras: userObrasList,
        } as UserDisplay;
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: { nome: string; email: string; role: UserRole; obraIds: string[] }) => {
      // Try admin API first, fallback to regular signup
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { nome: userData.nome },
      });

      if (authError) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: userData.email,
          password: DEFAULT_PASSWORD,
          options: { data: { nome: userData.nome } },
        });
        
        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error('Erro ao criar usuário');
        
        return { userId: signUpData.user.id, userData };
      }

      return { userId: authData.user.id, userData };
    },
    onSuccess: async ({ userId, userData }) => {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: userData.role });

      if (roleError) console.error('Error adding role:', roleError);

      if (userData.role === 'obra' && userData.obraIds.length > 0) {
        const obraInserts = userData.obraIds.map(obraId => ({
          user_id: userId,
          obra_id: obraId,
        }));

        const { error: obrasError } = await supabase.from('user_obras').insert(obraInserts);
        if (obrasError) console.error('Error adding obras:', obrasError);
      }

      queryClient.invalidateQueries({ queryKey: ['users'] });
      setNewUser({ nome: '', email: '', role: 'obra', obraIds: [] });
      setIsDialogOpen(false);
      toast.success('Usuário criado com sucesso!', {
        description: `Senha padrão: ${DEFAULT_PASSWORD}`,
      });
    },
    onError: (error: any) => {
      console.error('Error creating user:', error);
      let message = 'Erro ao criar usuário';
      if (error.message?.includes('already registered')) {
        message = 'Este email já está cadastrado.';
      }
      toast.error(message);
    },
  });

  const handleCreateUser = () => {
    if (!newUser.nome || !newUser.email) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    createUserMutation.mutate(newUser);
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
                    </SelectContent>
                  </Select>
                </div>
                {newUser.role === 'obra' && (
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
                    'Criar Usuário'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

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
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                      }`}
                    >
                      <Shield className="h-3 w-3" />
                      {user.role === 'admin' ? 'Admin' : 'Obra'}
                    </span>
                  </div>
                  {user.role === 'obra' && user.obras.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span className="truncate">{user.obras.map(o => o.nome).join(', ')}</span>
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
