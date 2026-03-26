import * as React from 'react';
import { cn } from '@/lib/utils/cn';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'destructive' | 'ghost' };

export function Button({ className, variant = 'default', ...props }: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50',
        variant === 'default' ? 'bg-black text-white dark:bg-white dark:text-black' : 
        variant === 'outline' ? 'border border-border bg-transparent' :
        variant === 'ghost' ? 'hover:bg-accent hover:text-accent-foreground bg-transparent' :
        variant === 'destructive' ? 'bg-red-600 text-white hover:bg-red-700' : '',
        className,
      )}
      {...props}
    />
  );
}
