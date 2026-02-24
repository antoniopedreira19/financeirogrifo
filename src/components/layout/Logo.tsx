import logoSemFundo from '@/assets/logo-sem-fundo.png';

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
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  const subTextSizeClasses = {
    sm: 'text-[8px]',
    md: 'text-[9px]',
    lg: 'text-[10px]',
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
        src={logoSemFundo}
        alt="Grifo Logo"
        className={`${sizeClasses[size]} w-auto object-contain`}
        loading="eager"
        fetchPriority="high"
        decoding="sync"
      />
      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-bold tracking-tight ${textSizeClasses[size]} ${getTextColor()}`}
            style={{ fontFamily: "'Disket Mono', monospace" }}
          >
            GRIFO
          </span>
          <span
            className={`font-medium tracking-widest uppercase ${subTextSizeClasses[size]} ${getSubTextColor()}`}
            style={{ fontFamily: "'Disket Mono', monospace" }}
          >
            FINANCEIRO
          </span>
        </div>
      )}
    </div>
  );
}
