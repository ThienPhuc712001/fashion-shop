import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export function Spinner({ className, size = 'default' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-primary border-t-transparent',
        sizeClasses[size],
        className
      )}
    />
  );
}

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Spinner size="lg" />
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

interface ErrorDisplayProps {
  message: string;
  title?: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ message, title = 'Lỗi', onRetry }: ErrorDisplayProps) {
  return (
    <div className="text-center py-8">
      <p className="text-destructive font-semibold">{title}</p>
      <p className="text-muted-foreground mt-2">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}
