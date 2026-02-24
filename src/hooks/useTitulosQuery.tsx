import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Titulo, TituloStatus, DashboardStats } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface TituloRow {
  id: string;
  empresa: string;
  credor: string;
  documento_tipo: string;
  documento_numero: string;
  obra_id: string;
  obra_codigo: string;
  centro_custo: string;
  etapa: string;
  codigo_etapa?: string;
  valor_total: number;
  descontos?: number;
  parcelas: number;
  tipo_documento: string;
  numero_documento: string;
  data_emissao: string;
  data_vencimento: string;
  plano_financeiro: string;
  dados_bancarios: any;
  documento_url?: string;
  tipo_leitura_pagamento?: string;
  arquivo_pagamento_url?: string;
  status: string;
  created_by: string;
  criador: string;
  aprovado_por: string | null;
  aprovado_em: string | null;
  pago_por: string | null;
  pago_em: string | null;
  motivo_reprovacao: string | null;
  id_sienge?: number | null;
  descricao?: string | null;
  created_at: string;
  updated_at: string;
  obras?: { nome: string } | null;
}

function mapTituloFromDB(row: TituloRow): Titulo {
  return {
    id: row.id,
    empresa: row.empresa,
    credor: row.credor,
    documento: row.documento_numero,
    tipoDocumento: row.documento_tipo as 'cnpj' | 'cpf',
    obraId: row.obra_id,
    obraCodigo: row.obra_codigo,
    obraNome: row.obras?.nome || '',
    centroCusto: row.centro_custo,
    etapaApropriada: row.etapa,
    codigoEtapa: row.codigo_etapa || undefined,
    valorTotal: row.valor_total,
    descontos: row.descontos || 0,
    parcelas: row.parcelas,
    tipoDocumentoFiscal: row.tipo_documento as any,
    numeroDocumento: row.numero_documento,
    dataEmissao: row.data_emissao as unknown as Date,
    dataVencimento: row.data_vencimento as unknown as Date,
    planoFinanceiro: row.plano_financeiro as any,
    dadosBancarios: typeof row.dados_bancarios === 'string' 
      ? row.dados_bancarios 
      : JSON.stringify(row.dados_bancarios || ''),
    tipoLeituraPagamento: row.tipo_leitura_pagamento as any,
    arquivoPagamentoUrl: row.arquivo_pagamento_url || undefined,
    documentoUrl: row.documento_url || undefined,
    status: row.status as TituloStatus,
    criadoPor: row.created_by,
    criadoPorNome: row.criador,
    aprovadoPor: row.aprovado_por || undefined,
    dataAprovacao: row.aprovado_em ? new Date(row.aprovado_em) : undefined,
    pagoPor: row.pago_por || undefined,
    dataPagamento: row.pago_em ? new Date(row.pago_em) : undefined,
    motivoReprovacao: row.motivo_reprovacao || undefined,
    idSienge: row.id_sienge || undefined,
    descricao: row.descricao || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// Fetch from titulos_pendentes (enviado, aprovado, reprovado)
export function useTitulosPendentesQuery(obraId?: string) {
  return useQuery({
    queryKey: ['titulos_pendentes', obraId],
    queryFn: async () => {
      let query = supabase
        .from('titulos_pendentes')
        .select(`
          *,
          obras (nome)
        `)
        .order('created_at', { ascending: false });

      if (obraId) {
        query = query.eq('obra_id', obraId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching titulos_pendentes:', error);
        throw error;
      }

      return (data || []).map(row => mapTituloFromDB(row as unknown as TituloRow));
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
}

// Fetch titulos from titulos table (pago + processando_pagamento)
export function useTitulosPagosQuery(obraId?: string) {
  return useQuery({
    queryKey: ['titulos', obraId],
    queryFn: async () => {
      let query = supabase
        .from('titulos')
        .select(`
          *,
          obras (nome)
        `)
        .in('status', ['pago', 'processando_pagamento'])
        .order('created_at', { ascending: false });

      if (obraId) {
        query = query.eq('obra_id', obraId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching titulos pagos:', error);
        throw error;
      }

      return (data || []).map(row => mapTituloFromDB(row as unknown as TituloRow));
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
}

// Combined query for all titulos (pendentes + pagos)
export function useTitulosQuery(obraId?: string) {
  const { data: pendentes = [], isLoading: loadingPendentes } = useTitulosPendentesQuery(obraId);
  const { data: pagos = [], isLoading: loadingPagos } = useTitulosPagosQuery(obraId);

  return {
    data: [...pendentes, ...pagos].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    isLoading: loadingPendentes || loadingPagos,
  };
}

export function useTitulosByStatus(status: TituloStatus) {
  return useQuery({
    queryKey: ['titulos', 'status', status],
    queryFn: async () => {
      // Titulos na tabela 'titulos': pago e processando_pagamento
      if (status === 'pago' || status === 'processando_pagamento') {
        const { data, error } = await supabase
          .from('titulos')
          .select(`
            *,
            obras (nome)
          `)
          .eq('status', status)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching titulos by status:', error);
          throw error;
        }

        return (data || []).map(row => mapTituloFromDB(row as unknown as TituloRow));
      }

      // Other statuses are in titulos_pendentes
      const { data, error } = await supabase
        .from('titulos_pendentes')
        .select(`
          *,
          obras (nome)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching titulos_pendentes by status:', error);
        throw error;
      }

      return (data || []).map(row => mapTituloFromDB(row as unknown as TituloRow));
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: 'always', // Always refetch on mount
  });
}

// Create titulo in titulos_pendentes
export function useCreateTitulo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (titulo: {
      empresa: string;
      credor: string;
      documentoTipo: 'cnpj' | 'cpf';
      documentoNumero: string;
      creditorId?: number | null;
      obraId: string;
      obraCodigo: string;
      grupoId?: string;
      centroCusto: string;
      etapa: string;
      codigoEtapa?: string;
      valorTotal: number;
      descontos: number;
      parcelas: number;
      tipoDocumento: string;
      numeroDocumento: string;
      dataEmissao: Date;
      dataVencimento: Date;
      planoFinanceiro: string;
      dadosBancarios: string | object;
      tipoLeituraPagamento?: string;
      createdBy: string;
      criador: string;
      documentoUrl?: string;
      arquivoPagamentoUrl?: string;
      descricao?: string;
      rateioFinanceiro?: Array<{ centro_custo_id: string; percentual: number }>;
      apropObra?: Array<{ etapa: string; percentual: number }>;
    }) => {
      // Get user's empresa_id from their profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("empresa_id")
        .eq("id", titulo.createdBy)
        .single();

      if (!profile?.empresa_id) throw new Error("Empresa não encontrada");

      const insertData = {
        empresa: titulo.empresa,
        credor: titulo.credor,
        documento_tipo: titulo.documentoTipo,
        documento_numero: titulo.documentoNumero,
        creditor_id: titulo.creditorId || null,
        obra_id: titulo.obraId,
        obra_codigo: titulo.obraCodigo,
        grupo_id: titulo.grupoId || null,
        centro_custo: titulo.centroCusto,
        etapa: titulo.etapa,
        codigo_etapa: titulo.codigoEtapa || titulo.etapa,
        valor_total: titulo.valorTotal,
        descontos: titulo.descontos,
        parcelas: titulo.parcelas,
        tipo_documento: titulo.tipoDocumento as any,
        numero_documento: titulo.numeroDocumento,
        data_emissao: titulo.dataEmissao.toISOString().split('T')[0],
        data_vencimento: titulo.dataVencimento.toISOString().split('T')[0],
        plano_financeiro: titulo.planoFinanceiro as 'servicos_terceiros' | 'materiais_aplicados',
        dados_bancarios: typeof titulo.dadosBancarios === 'string' ? titulo.dadosBancarios : JSON.stringify(titulo.dadosBancarios),
        tipo_leitura_pagamento: titulo.tipoLeituraPagamento || null,
        created_by: titulo.createdBy,
        criador: titulo.criador,
        documento_url: titulo.documentoUrl,
        arquivo_pagamento_url: titulo.arquivoPagamentoUrl,
        descricao: titulo.descricao || null,
        empresa_id: profile.empresa_id,
        rateio_financeiro: titulo.rateioFinanceiro ? JSON.stringify(titulo.rateioFinanceiro) : '[]',
        aprop_obra: titulo.apropObra ? JSON.stringify(titulo.apropObra) : '[]',
      };

      const { data, error } = await supabase
        .from('titulos_pendentes')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['titulos_pendentes'] });
      toast({
        title: 'Título criado',
        description: 'O título foi enviado para aprovação.',
      });
    },
    onError: (error: any) => {
      console.error('Error creating titulo:', error);
      toast({
        title: 'Erro ao criar título',
        description: error.message || 'Ocorreu um erro ao criar o título.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateTituloStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      userId,
      motivoReprovacao,
      obs,
      idSienge,
    }: {
      id: string;
      status: TituloStatus;
      userId: string;
      motivoReprovacao?: string;
      obs?: string;
      idSienge?: number;
    }) => {
      // For "pago" status, move from titulos_pendentes to titulos
      if (status === 'pago') {
        // First, get the titulo from pendentes
        const { data: pendente, error: fetchError } = await supabase
          .from('titulos_pendentes')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        // Insert into titulos with pago status (id_sienge já vem do titulo_pendente)
        const { error: insertError } = await supabase
          .from('titulos')
          .insert({
            empresa: pendente.empresa,
            credor: pendente.credor,
            documento_tipo: pendente.documento_tipo,
            documento_numero: pendente.documento_numero,
            obra_id: pendente.obra_id,
            obra_codigo: pendente.obra_codigo,
            grupo_id: pendente.grupo_id,
            centro_custo: pendente.centro_custo,
            etapa: pendente.etapa,
            codigo_etapa: pendente.codigo_etapa,
            valor_total: pendente.valor_total,
            descontos: pendente.descontos,
            parcelas: pendente.parcelas,
            tipo_documento: pendente.tipo_documento,
            numero_documento: pendente.numero_documento,
            data_emissao: pendente.data_emissao,
            data_vencimento: pendente.data_vencimento,
            plano_financeiro: pendente.plano_financeiro,
            dados_bancarios: pendente.dados_bancarios,
            tipo_leitura_pagamento: pendente.tipo_leitura_pagamento,
            arquivo_pagamento_url: pendente.arquivo_pagamento_url,
            documento_url: pendente.documento_url,
            descricao: pendente.descricao,
            id_sienge: pendente.id_sienge,
            status: 'pago',
            criador: pendente.criador,
            created_by: pendente.created_by,
            aprovado_por: pendente.aprovado_por,
            aprovado_em: pendente.aprovado_em,
            pago_por: userId,
            pago_em: new Date().toISOString(),
            created_at: pendente.created_at,
            obs: obs || null,
            empresa_id: (pendente as any).empresa_id,
            rateio_financeiro: pendente.rateio_financeiro,
            aprop_obra: pendente.aprop_obra,
          });

        if (insertError) throw insertError;

        // Delete from titulos_pendentes
        const { error: deleteError } = await supabase
          .from('titulos_pendentes')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;

        return { id, status: 'pago' };
      }

      // For other statuses, update in titulos_pendentes
      const updateData: any = { status };

      if (status === 'aprovado') {
        updateData.aprovado_por = userId;
        updateData.aprovado_em = new Date().toISOString();
        // Salva o id_sienge retornado pelo webhook
        if (idSienge) {
          updateData.id_sienge = idSienge;
        }
      } else if (status === 'reprovado') {
        updateData.aprovado_por = userId;
        updateData.aprovado_em = new Date().toISOString();
        updateData.motivo_reprovacao = motivoReprovacao;
      }

      const { data, error } = await supabase
        .from('titulos_pendentes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['titulos_pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['titulos'] });
      
      const messages: Record<TituloStatus, string> = {
        enviado: 'Título reenviado.',
        aprovado: 'Título aprovado e lançado no Sienge.',
        reprovado: 'Título reprovado.',
        pago: 'Pagamento registrado.',
        processando_pagamento: 'Pagamento em processamento.',
      };
      
      toast({
        title: 'Status atualizado',
        description: messages[variables.status],
      });
    },
    onError: (error: any) => {
      console.error('Error updating titulo status:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: error.message || 'Ocorreu um erro ao atualizar o status.',
        variant: 'destructive',
      });
    },
  });
}

export function useTitulosStats(obraId?: string) {
  const { data: titulos = [] } = useTitulosQuery(obraId);

  const stats: DashboardStats = {
    total: titulos.length,
    enviados: titulos.filter(t => t.status === 'enviado').length,
    aprovados: titulos.filter(t => t.status === 'aprovado').length,
    reprovados: titulos.filter(t => t.status === 'reprovado').length,
    pagos: titulos.filter(t => t.status === 'pago').length,
    valorTotal: titulos.reduce((acc, t) => acc + t.valorTotal, 0),
    valorPendente: titulos
      .filter(t => t.status === 'enviado' || t.status === 'aprovado')
      .reduce((acc, t) => acc + t.valorTotal, 0),
    valorPago: titulos
      .filter(t => t.status === 'pago')
      .reduce((acc, t) => acc + t.valorTotal, 0),
  };

  return stats;
}
