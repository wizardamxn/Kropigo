'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  id,
  label,
  error,
  required = false,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5 w-full", className)}>
      <div className="flex justify-between items-center ml-1">
        <Label htmlFor={id} className="text-stone-850 dark:text-stone-300 font-medium">
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </Label>
      </div>
      {children}
      {error && (
        <p
          id={`${id}-error`}
          className="text-xs text-red-500 dark:text-red-400 font-sans ml-1 mt-0.5 animate-in fade-in duration-200"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;
