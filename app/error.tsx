'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorDisplay } from '@/components/ui/error-display';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <ErrorDisplay
        title="Đã xảy ra lỗi"
        message={error.message || 'Một lỗi không mong muốn đã xảy ra. Vui lòng thử lại sau.'}
        onRetry={reset}
      />
    </div>
  );
}
