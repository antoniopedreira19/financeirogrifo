export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      empresas: {
        Row: {
          ativa: boolean
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativa?: boolean
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativa?: boolean
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      obra_etapas: {
        Row: {
          codigo: string
          created_at: string
          id: string
          nome: string
          obra_id: string
        }
        Insert: {
          codigo: string
          created_at?: string
          id?: string
          nome: string
          obra_id: string
        }
        Update: {
          codigo?: string
          created_at?: string
          id?: string
          nome?: string
          obra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obra_etapas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          ativa: boolean
          codigo: string
          created_at: string
          empresa_id: string
          endereco: string | null
          grupo_id: string | null
          id: string
          nome: string
          permite_sem_apropriacao: boolean
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          codigo: string
          created_at?: string
          empresa_id: string
          endereco?: string | null
          grupo_id?: string | null
          id?: string
          nome: string
          permite_sem_apropriacao?: boolean
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          codigo?: string
          created_at?: string
          empresa_id?: string
          endereco?: string | null
          grupo_id?: string | null
          id?: string
          nome?: string
          permite_sem_apropriacao?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "obras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          empresa_id: string
          id: string
          nome: string
          perfil_completo: boolean
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          empresa_id: string
          id: string
          nome: string
          perfil_completo?: boolean
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          empresa_id?: string
          id?: string
          nome?: string
          perfil_completo?: boolean
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      titulos: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          arquivo_pagamento_url: string | null
          centro_custo: string
          codigo_etapa: string | null
          created_at: string
          created_by: string
          credor: string
          criador: string
          dados_bancarios: Json | null
          data_emissao: string
          data_vencimento: string
          descontos: number | null
          descricao: string | null
          documento_numero: string
          documento_tipo: string
          documento_url: string | null
          empresa: string
          empresa_id: string
          etapa: string
          grupo_id: string | null
          id: string
          id_sienge: number | null
          motivo_reprovacao: string | null
          numero_documento: string
          obra_codigo: string
          obra_id: string
          obs: string | null
          pago_em: string | null
          pago_por: string | null
          parcelas: number
          plano_financeiro: Database["public"]["Enums"]["plano_financeiro"]
          status: Database["public"]["Enums"]["titulo_status"]
          tipo_documento: Database["public"]["Enums"]["tipo_documento"]
          tipo_leitura_pagamento: string | null
          updated_at: string
          valor_total: number
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          arquivo_pagamento_url?: string | null
          centro_custo: string
          codigo_etapa?: string | null
          created_at?: string
          created_by: string
          credor: string
          criador: string
          dados_bancarios?: Json | null
          data_emissao?: string
          data_vencimento: string
          descontos?: number | null
          descricao?: string | null
          documento_numero: string
          documento_tipo: string
          documento_url?: string | null
          empresa: string
          empresa_id: string
          etapa: string
          grupo_id?: string | null
          id?: string
          id_sienge?: number | null
          motivo_reprovacao?: string | null
          numero_documento: string
          obra_codigo: string
          obra_id: string
          obs?: string | null
          pago_em?: string | null
          pago_por?: string | null
          parcelas?: number
          plano_financeiro: Database["public"]["Enums"]["plano_financeiro"]
          status?: Database["public"]["Enums"]["titulo_status"]
          tipo_documento: Database["public"]["Enums"]["tipo_documento"]
          tipo_leitura_pagamento?: string | null
          updated_at?: string
          valor_total: number
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          arquivo_pagamento_url?: string | null
          centro_custo?: string
          codigo_etapa?: string | null
          created_at?: string
          created_by?: string
          credor?: string
          criador?: string
          dados_bancarios?: Json | null
          data_emissao?: string
          data_vencimento?: string
          descontos?: number | null
          descricao?: string | null
          documento_numero?: string
          documento_tipo?: string
          documento_url?: string | null
          empresa?: string
          empresa_id?: string
          etapa?: string
          grupo_id?: string | null
          id?: string
          id_sienge?: number | null
          motivo_reprovacao?: string | null
          numero_documento?: string
          obra_codigo?: string
          obra_id?: string
          obs?: string | null
          pago_em?: string | null
          pago_por?: string | null
          parcelas?: number
          plano_financeiro?: Database["public"]["Enums"]["plano_financeiro"]
          status?: Database["public"]["Enums"]["titulo_status"]
          tipo_documento?: Database["public"]["Enums"]["tipo_documento"]
          tipo_leitura_pagamento?: string | null
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "titulos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "titulos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      titulos_pendentes: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          arquivo_pagamento_url: string | null
          centro_custo: string
          codigo_etapa: string | null
          created_at: string
          created_by: string
          credor: string
          criador: string
          dados_bancarios: Json | null
          data_emissao: string
          data_vencimento: string
          descontos: number | null
          descricao: string | null
          documento_numero: string
          documento_tipo: string
          documento_url: string | null
          empresa: string
          empresa_id: string
          etapa: string
          grupo_id: string | null
          id: string
          id_sienge: number | null
          motivo_reprovacao: string | null
          numero_documento: string
          obra_codigo: string
          obra_id: string
          parcelas: number
          plano_financeiro: Database["public"]["Enums"]["plano_financeiro"]
          status: Database["public"]["Enums"]["titulo_status"]
          tipo_documento: Database["public"]["Enums"]["tipo_documento"]
          tipo_leitura_pagamento: string | null
          updated_at: string
          valor_total: number
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          arquivo_pagamento_url?: string | null
          centro_custo: string
          codigo_etapa?: string | null
          created_at?: string
          created_by: string
          credor: string
          criador: string
          dados_bancarios?: Json | null
          data_emissao?: string
          data_vencimento: string
          descontos?: number | null
          descricao?: string | null
          documento_numero: string
          documento_tipo: string
          documento_url?: string | null
          empresa: string
          empresa_id: string
          etapa: string
          grupo_id?: string | null
          id?: string
          id_sienge?: number | null
          motivo_reprovacao?: string | null
          numero_documento: string
          obra_codigo: string
          obra_id: string
          parcelas?: number
          plano_financeiro: Database["public"]["Enums"]["plano_financeiro"]
          status?: Database["public"]["Enums"]["titulo_status"]
          tipo_documento: Database["public"]["Enums"]["tipo_documento"]
          tipo_leitura_pagamento?: string | null
          updated_at?: string
          valor_total: number
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          arquivo_pagamento_url?: string | null
          centro_custo?: string
          codigo_etapa?: string | null
          created_at?: string
          created_by?: string
          credor?: string
          criador?: string
          dados_bancarios?: Json | null
          data_emissao?: string
          data_vencimento?: string
          descontos?: number | null
          descricao?: string | null
          documento_numero?: string
          documento_tipo?: string
          documento_url?: string | null
          empresa?: string
          empresa_id?: string
          etapa?: string
          grupo_id?: string | null
          id?: string
          id_sienge?: number | null
          motivo_reprovacao?: string | null
          numero_documento?: string
          obra_codigo?: string
          obra_id?: string
          parcelas?: number
          plano_financeiro?: Database["public"]["Enums"]["plano_financeiro"]
          status?: Database["public"]["Enums"]["titulo_status"]
          tipo_documento?: Database["public"]["Enums"]["tipo_documento"]
          tipo_leitura_pagamento?: string | null
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "titulos_pendentes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "titulos_pendentes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      user_obras: {
        Row: {
          created_at: string
          id: string
          obra_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          obra_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          obra_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_obras_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_empresa_id: { Args: { _user_id: string }; Returns: string }
      has_obra_access: {
        Args: { _obra_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "obra"
      plano_financeiro: "servicos_terceiros" | "materiais_aplicados"
      tipo_documento: "NF" | "BOL" | "REC" | "PRV" | "FAT"
      titulo_status: "enviado" | "aprovado" | "reprovado" | "pago"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "obra"],
      plano_financeiro: ["servicos_terceiros", "materiais_aplicados"],
      tipo_documento: ["NF", "BOL", "REC", "PRV", "FAT"],
      titulo_status: ["enviado", "aprovado", "reprovado", "pago"],
    },
  },
} as const
