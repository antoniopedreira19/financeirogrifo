export type UserRole = 'admin' | 'obra';

export type TituloStatus = 'enviado' | 'aprovado' | 'reprovado' | 'pago';

export type DocumentoTipo = 'nota_fiscal' | 'boleto' | 'recibo' | 'contrato' | 'outros';

export type PlanoFinanceiro = 'servicos_terceiros' | 'materiais_aplicados';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  obras: string[]; // IDs das obras vinculadas
  createdAt: Date;
}

export interface Obra {
  id: string;
  nome: string;
  codigo: string;
  endereco: string;
  ativa: boolean;
  grupoId?: string;
  createdAt: Date;
}

export type TipoPagamento = 'manual' | 'boleto' | 'qrcode';

export interface Titulo {
  id: string;
  empresa: string;
  credor: string;
  documento: string; // CNPJ ou CPF
  tipoDocumento: 'cnpj' | 'cpf';
  obraId: string;
  obraNome?: string;
  centroCusto: string;
  etapaApropriada: string;
  codigoEtapa?: string;
  valorTotal: number;
  descontos?: number;
  parcelas: number;
  tipoDocumentoFiscal: DocumentoTipo;
  numeroDocumento: string;
  dataEmissao: Date;
  dataVencimento: Date;
  planoFinanceiro: PlanoFinanceiro;
  dadosBancarios: string;
  tipoLeituraPagamento?: TipoPagamento;
  arquivoPagamentoUrl?: string;
  status: TituloStatus;
  criadoPor: string;
  criadoPorNome?: string;
  aprovadoPor?: string;
  dataAprovacao?: Date;
  pagoPor?: string;
  dataPagamento?: Date;
  motivoReprovacao?: string;
  idSienge?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  total: number;
  enviados: number;
  aprovados: number;
  reprovados: number;
  pagos: number;
  valorTotal: number;
  valorPendente: number;
  valorPago: number;
}
