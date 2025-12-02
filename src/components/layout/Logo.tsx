import logoLight from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';

interface LogoProps {
  variant?: 'light' | 'dark' | 'onDark';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ variant = 'light', size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const getTextColor = () => {
    switch (variant) {
      case 'dark':
        return 'text-sidebar-foreground';
      case 'onDark':
        return 'text-white';
      default:
        return 'text-foreground';
    }
  };

  const getSubTextColor = () => {
    switch (variant) {
      case 'dark':
        return 'text-sidebar-foreground/60';
      case 'onDark':
        return 'text-white/70';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex items-center gap-3">
      <img
        src={variant === 'dark' ? logoDark : logoLight}
        alt="Grifo Logo"
        className={`${sizeClasses[size]} w-auto object-contain`}
      />
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold tracking-tight ${textSizeClasses[size]} ${getTextColor()}`}>
            GRIFO
          </span>
          <span className={`text-xs font-medium tracking-widest uppercase ${getSubTextColor()}`}>
            Financeiro
          </span>
        </div>
      )}
    </div>
  );
}