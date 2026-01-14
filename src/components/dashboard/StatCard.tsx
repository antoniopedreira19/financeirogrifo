import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'destructive';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  showIcon?: boolean;
}

export function StatCard({ title, value, subtitle, icon, variant = 'default', trend, onClick, showIcon }: StatCardProps) {
  const variantClasses = {
    default: 'bg-card',
    primary: 'bg-primary',
    accent: 'bg-accent',
    success: 'bg-success/10 border-success/20',
    warning: 'bg-warning/10 border-warning/20',
    destructive: 'bg-destructive/10 border-destructive/20',
  };

  const iconBgClasses = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary-foreground/20 text-primary-foreground',
    accent: 'bg-accent-foreground/20 text-accent-foreground',
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
    destructive: 'bg-destructive/20 text-destructive',
  };

  return (
    <div 
      className={cn(
        "stat-card animate-fade-in",
        variantClasses[variant],
        onClick && "cursor-pointer hover:shadow-lg transition-shadow"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className={cn(
          "p-3 rounded-xl",
          iconBgClasses[variant]
        )}>
          {icon}
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            trend.isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className={cn(
          "text-sm font-medium",
          variant === 'default' ? 'text-muted-foreground' : 'text-foreground'
        )}>
          {title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <p className={cn(
            "text-2xl lg:text-3xl font-bold",
            variant === 'default' ? 'text-foreground' : 'text-foreground'
          )}>
            {value}
          </p>
          {showIcon && (
            <span className={cn(
              "p-1.5 rounded-full",
              iconBgClasses[variant]
            )}>
              {icon}
            </span>
          )}
        </div>
        {subtitle && (
          <p className={cn(
            "text-sm mt-1",
            variant === 'default' ? 'text-muted-foreground' : 'text-foreground/80'
          )}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
