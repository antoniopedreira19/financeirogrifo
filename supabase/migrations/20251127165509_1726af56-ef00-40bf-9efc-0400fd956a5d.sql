-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'obra');

-- Create enum for titulo status
CREATE TYPE public.titulo_status AS ENUM ('enviado', 'aprovado', 'reprovado', 'pago');

-- Create enum for document type
CREATE TYPE public.tipo_documento AS ENUM ('nota_fiscal', 'boleto', 'recibo', 'contrato', 'outro');

-- Create enum for plano financeiro
CREATE TYPE public.plano_financeiro AS ENUM ('servicos_terceiros', 'materiais_aplicados');

-- Create obras table
CREATE TABLE public.obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  endereco TEXT,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (security best practice - roles in separate table)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create user_obras junction table (links users to obras they can access)
CREATE TABLE public.user_obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, obra_id)
);

-- Create titulos table
CREATE TABLE public.titulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  empresa TEXT NOT NULL,
  credor TEXT NOT NULL,
  documento_tipo TEXT NOT NULL CHECK (documento_tipo IN ('cnpj', 'cpf')),
  documento_numero TEXT NOT NULL,
  centro_custo TEXT NOT NULL,
  etapa TEXT NOT NULL,
  valor_total DECIMAL(15,2) NOT NULL,
  parcelas INTEGER NOT NULL DEFAULT 1,
  tipo_documento tipo_documento NOT NULL,
  numero_documento TEXT NOT NULL,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  plano_financeiro plano_financeiro NOT NULL,
  dados_bancarios JSONB,
  status titulo_status NOT NULL DEFAULT 'enviado',
  aprovado_por UUID REFERENCES auth.users(id),
  aprovado_em TIMESTAMP WITH TIME ZONE,
  pago_por UUID REFERENCES auth.users(id),
  pago_em TIMESTAMP WITH TIME ZONE,
  motivo_reprovacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.titulos ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Security definer function to check if user has access to obra
CREATE OR REPLACE FUNCTION public.has_obra_access(_user_id UUID, _obra_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_obras
    WHERE user_id = _user_id
      AND obra_id = _obra_id
  ) OR public.has_role(_user_id, 'admin')
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for obras
CREATE POLICY "Users can view obras they have access to"
  ON public.obras FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    id IN (SELECT obra_id FROM public.user_obras WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all obras"
  ON public.obras FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_obras
CREATE POLICY "Users can view their own obra assignments"
  ON public.user_obras FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage user_obras"
  ON public.user_obras FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for titulos
CREATE POLICY "Users can view titulos from their obras"
  ON public.titulos FOR SELECT
  TO authenticated
  USING (public.has_obra_access(auth.uid(), obra_id));

CREATE POLICY "Users can insert titulos for their obras"
  ON public.titulos FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_obra_access(auth.uid(), obra_id) AND
    created_by = auth.uid()
  );

CREATE POLICY "Admins can update any titulo"
  ON public.titulos FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Obra users can update their own pending titulos"
  ON public.titulos FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() AND 
    status = 'enviado'
  );

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_obras_updated_at
  BEFORE UPDATE ON public.obras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_titulos_updated_at
  BEFORE UPDATE ON public.titulos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();