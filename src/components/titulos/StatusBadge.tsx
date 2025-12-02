import { TituloStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle, XCircle, Wallet } from 'lucide-react';

interface StatusBadgeProps {
  status: TituloStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<TituloStatus, { label: string; className: string; icon: typeof Clock }> = {
  enviado: {
    label: 'Enviado',
    className: 'status-enviado',
    icon: Clock,
  },
  aprovado: {
    label: 'Aprovado',
    className: 'status-aprovado',
    icon: CheckCircle,
  },
  reprovado: {
    label: 'Reprovado',
    className: 'status-reprovado',
    icon: XCircle,
  },
  pago: {
    label: 'Pago',
    className: 'status-pago',
    icon: Wallet,
  },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={cn(
      "status-badge",
      config.className,
      size === 'sm' && "text-[10px] px-2 py-0.5"
    )}>
      <Icon className={cn("h-3.5 w-3.5", size === 'sm' && "h-3 w-3")} />
      {config.label}
    </span>
  );
}
