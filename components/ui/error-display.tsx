import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({
  title = 'Đã xảy ra lỗi',
  message,
  onRetry,
  className,
}: ErrorDisplayProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 p-8 text-center', className)}>
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Thử lại
        </Button>
      )}
    </div>
  );
}
