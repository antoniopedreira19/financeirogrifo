-- Add phone and profile_completed fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN telefone text,
ADD COLUMN perfil_completo boolean NOT NULL DEFAULT false;