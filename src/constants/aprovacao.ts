import { UserRole } from '@/types';

/**
 * Alçadas de aprovação/pagamento por role.
 * Valor máximo que cada role pode aprovar E pagar.
 * Infinity = sem limite.
 */
const ALCADA: Record<string, number> = {
  engenheiro_assistente: 1_000,
  engenheiro: 10_000,
  diretor_obra: 50_000,
  diretor: Infinity,
  admin: Infinity,
};

/**
 * Verifica se a role pode aprovar um título com o valor informado.
 */
export function podeAprovar(role: UserRole, valorTitulo: number): boolean {
  const limite = ALCADA[role];
  if (limite === undefined) return false; // obra, orcamento → não aprovam
  return valorTitulo <= limite;
}

/**
 * Verifica se a role pode pagar (manual ou Asaas) um título com o valor informado.
 * Mesma lógica da aprovação — quem pode aprovar, pode pagar.
 */
export function podePagar(role: UserRole, valorTitulo: number): boolean {
  return podeAprovar(role, valorTitulo);
}

/**
 * Labels amigáveis para exibição das roles.
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  obra: 'Equipe de Obra',
  orcamento: 'Orçamento',
  engenheiro_assistente: 'Eng. Assistente',
  engenheiro: 'Engenheiro',
  diretor_obra: 'Diretor de Obra',
  diretor: 'Diretor',
};

/**
 * Retorna o limite formatado para exibição.
 */
export function getLimiteFormatado(role: UserRole): string {
  const limite = ALCADA[role];
  if (limite === undefined) return 'Sem permissão';
  if (limite === Infinity) return 'Sem limite';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(limite);
}
