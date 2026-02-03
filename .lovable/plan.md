
# Plano: Sistema Multi-Tenant por Empresa

## Visao Geral

Este plano implementa isolamento de dados por empresa (multi-tenancy), onde cada usuario pertence a uma empresa e so pode ver dados da sua propria empresa - incluindo administradores.

---

## Arquitetura Proposta

```text
+------------------+       +------------------+
|    empresas      |       |    profiles      |
|------------------|       |------------------|
| id (uuid, PK)    |<------| empresa_id (FK)  |
| nome             |       | id, nome, email  |
| ativa            |       +------------------+
| created_at       |               |
+------------------+               |
        |                          |
        v                          v
+------------------+       +------------------+
|     obras        |       |   user_roles     |
|------------------|       |------------------|
| empresa_id (FK)  |       | user_id, role    |
| id, nome, codigo |       +------------------+
+------------------+
        |
        v
+------------------+
|    titulos*      |
|------------------|
| empresa_id (FK)  |
| obra_id, etc...  |
+------------------+
* Inclui titulos e titulos_pendentes
```

---

## O Que Sera Alterado

### 1. Banco de Dados

**Nova Tabela: `empresas`**
- `id` (uuid) - Chave primaria
- `nome` (text) - Nome da empresa
- `ativa` (boolean) - Se a empresa esta ativa
- `created_at` (timestamp)

**Colunas Adicionadas:**
- `profiles.empresa_id` - Vincula usuario a empresa
- `obras.empresa_id` - Vincula obra a empresa
- `titulos.empresa_id` - Vincula titulo a empresa
- `titulos_pendentes.empresa_id` - Vincula titulo pendente a empresa

**Dados Iniciais:**
- Criar empresa "Grifo Engenharia"
- Atualizar todos os registros existentes (profiles, obras, titulos, titulos_pendentes) para pertencer a essa empresa

---

### 2. Funcoes de Seguranca (RLS)

**Nova Funcao: `get_user_empresa_id`**
```sql
CREATE OR REPLACE FUNCTION public.get_user_empresa_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id FROM public.profiles WHERE id = _user_id
$$;
```

Esta funcao sera usada em todas as policies RLS para garantir isolamento por empresa.

---

### 3. Politicas RLS Atualizadas

Todas as tabelas terao suas policies atualizadas para incluir verificacao de empresa:

**Obras:**
```sql
-- Admins podem gerenciar obras da sua empresa
has_role(auth.uid(), 'admin') 
  AND empresa_id = get_user_empresa_id(auth.uid())

-- Usuarios veem obras da sua empresa que tem acesso
empresa_id = get_user_empresa_id(auth.uid())
  AND (has_role(auth.uid(), 'admin') OR id IN (SELECT obra_id FROM user_obras WHERE user_id = auth.uid()))
```

**Titulos/Titulos Pendentes:**
```sql
-- Usuarios veem titulos da sua empresa
empresa_id = get_user_empresa_id(auth.uid())
  AND has_obra_access(auth.uid(), obra_id)
```

**Profiles:**
```sql
-- Admins veem usuarios da sua empresa
has_role(auth.uid(), 'admin') 
  AND empresa_id = get_user_empresa_id(auth.uid())
```

---

### 4. Edge Function `create-user`

Sera atualizada para:
1. Obter a `empresa_id` do admin que esta criando
2. Atribuir o novo usuario a mesma empresa
3. Salvar `empresa_id` no profile do novo usuario

---

### 5. Frontend

**Contexto de Autenticacao (`AuthContext`):**
- Adicionar `empresaId` e `empresaNome` ao perfil do usuario

**Hooks de Query:**
- `useObrasQuery` - Ja filtrado por RLS (sem mudancas no codigo)
- `useTitulosQuery` - Ja filtrado por RLS (sem mudancas no codigo)

**Admin Usuarios:**
- Mostrar somente usuarios da mesma empresa (RLS cuida disso)

**Admin Obras:**
- Ao criar obra, incluir `empresa_id` automaticamente

**Formulario de Titulos:**
- Ao criar titulo, incluir `empresa_id` automaticamente

---

## Passo a Passo da Implementacao

### Fase 1: Migracao do Banco de Dados

1. **Criar tabela `empresas`**
2. **Criar empresa "Grifo Engenharia"**
3. **Adicionar coluna `empresa_id` em:**
   - `profiles`
   - `obras`
   - `titulos`
   - `titulos_pendentes`
4. **Atualizar todos os registros existentes** com a empresa "Grifo Engenharia"
5. **Tornar `empresa_id` NOT NULL** (apos preencher os dados)
6. **Criar funcao `get_user_empresa_id`**

### Fase 2: Atualizar Policies RLS

1. **Dropar policies antigas** de todas as tabelas afetadas
2. **Criar novas policies** com filtro por empresa
3. **Testar acesso** para garantir isolamento

### Fase 3: Atualizar Edge Function

1. **Modificar `create-user`** para incluir `empresa_id`

### Fase 4: Atualizar Frontend

1. **Types:** Adicionar `Empresa` interface e atualizar `UserProfile`
2. **AuthContext:** Buscar e expor `empresaId`
3. **AdminObras:** Enviar `empresa_id` ao criar obras
4. **TituloForm:** Enviar `empresa_id` ao criar titulos
5. **AdminUsuarios:** Sem mudancas (RLS filtra automaticamente)

---

## Secao Tecnica

### SQL da Migracao Completa

```sql
-- 1. Criar tabela empresas
CREATE TABLE public.empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- 3. Inserir Grifo Engenharia
INSERT INTO public.empresas (id, nome) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Grifo Engenharia');

-- 4. Adicionar empresa_id nas tabelas
ALTER TABLE public.profiles ADD COLUMN empresa_id uuid REFERENCES public.empresas(id);
ALTER TABLE public.obras ADD COLUMN empresa_id uuid REFERENCES public.empresas(id);
ALTER TABLE public.titulos ADD COLUMN empresa_id uuid REFERENCES public.empresas(id);
ALTER TABLE public.titulos_pendentes ADD COLUMN empresa_id uuid REFERENCES public.empresas(id);

-- 5. Preencher todos os registros existentes
UPDATE public.profiles SET empresa_id = '11111111-1111-1111-1111-111111111111';
UPDATE public.obras SET empresa_id = '11111111-1111-1111-1111-111111111111';
UPDATE public.titulos SET empresa_id = '11111111-1111-1111-1111-111111111111';
UPDATE public.titulos_pendentes SET empresa_id = '11111111-1111-1111-1111-111111111111';

-- 6. Tornar NOT NULL
ALTER TABLE public.profiles ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.obras ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.titulos ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.titulos_pendentes ALTER COLUMN empresa_id SET NOT NULL;

-- 7. Criar funcao helper
CREATE OR REPLACE FUNCTION public.get_user_empresa_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id FROM public.profiles WHERE id = _user_id
$$;

-- 8. Policies para empresas
CREATE POLICY "Users can view their empresa"
ON public.empresas FOR SELECT
USING (id = get_user_empresa_id(auth.uid()));

-- 9. Atualizar policies de profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view empresa profiles"
ON public.profiles FOR SELECT
USING (
  has_role(auth.uid(), 'admin') 
  AND empresa_id = get_user_empresa_id(auth.uid())
);
-- Manter policy de view own profile

-- 10. Atualizar policies de obras
DROP POLICY IF EXISTS "Admins can manage all obras" ON public.obras;
DROP POLICY IF EXISTS "Users can view obras they have access to" ON public.obras;

CREATE POLICY "Admins can manage empresa obras"
ON public.obras FOR ALL
USING (
  has_role(auth.uid(), 'admin') 
  AND empresa_id = get_user_empresa_id(auth.uid())
);

CREATE POLICY "Users can view accessible obras"
ON public.obras FOR SELECT
USING (
  empresa_id = get_user_empresa_id(auth.uid())
  AND (
    has_role(auth.uid(), 'admin') 
    OR id IN (SELECT obra_id FROM user_obras WHERE user_id = auth.uid())
  )
);

-- 11. Atualizar policies de titulos_pendentes
DROP POLICY IF EXISTS "Users can view titulos_pendentes from their obras" ON public.titulos_pendentes;
DROP POLICY IF EXISTS "Admins can update any titulo_pendente" ON public.titulos_pendentes;
-- (demais policies)

CREATE POLICY "Users can view empresa titulos_pendentes"
ON public.titulos_pendentes FOR SELECT
USING (
  empresa_id = get_user_empresa_id(auth.uid())
  AND has_obra_access(auth.uid(), obra_id)
);

-- Policies similares para INSERT, UPDATE, DELETE...

-- 12. Atualizar policies de titulos (mesma logica)
-- ...
```

### Arquivos do Frontend a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/types/index.ts` | Adicionar interface `Empresa`, atualizar `User` |
| `src/hooks/useSupabaseAuth.tsx` | Buscar `empresa_id` do profile |
| `src/contexts/AuthContext.tsx` | Expor `empresaId` |
| `src/pages/admin/AdminObras.tsx` | Enviar `empresa_id` ao criar/editar |
| `src/components/titulos/TituloForm.tsx` | Enviar `empresa_id` ao criar titulo |
| `src/hooks/useTitulosQuery.tsx` | Enviar `empresa_id` na criacao |
| `supabase/functions/create-user/index.ts` | Herdar `empresa_id` do admin |

---

## Criacao de Novas Empresas

Para criar uma nova empresa e seu admin no futuro, voce devera:

1. **No Supabase (SQL Editor):**
   ```sql
   INSERT INTO empresas (nome) VALUES ('Nova Empresa');
   -- Anotar o id gerado
   ```

2. **Criar usuario admin:**
   - Criar usuario no Supabase Auth
   - Atualizar profile com `empresa_id` da nova empresa
   - Adicionar role `admin` em `user_roles`

---

## Resultado Final

- Usuarios so veem dados da sua empresa
- Admins gerenciam apenas sua empresa
- Isolamento total entre empresas
- Todos os usuarios atuais pertencem a "Grifo Engenharia"
- Preparado para adicionar novas empresas manualmente
