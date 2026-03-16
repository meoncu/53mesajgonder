import * as React from 'react';
import { cn } from '@/lib/utils/cn';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' };

export function Button({ className, variant = 'default', ...props }: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50',
        variant === 'default' ? 'bg-black text-white dark:bg-white dark:text-black' : 'border border-border',
        className,
      )}
      {...props}
    />
  );
}
