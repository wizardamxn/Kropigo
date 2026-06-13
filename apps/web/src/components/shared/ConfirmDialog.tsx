'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, HelpCircle, LucideIcon } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'default' | 'destructive' | 'success';
  icon?: LucideIcon;
}

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  isLoading = false,
  variant = 'default',
  icon: CustomIcon,
}: ConfirmDialogProps) {
  const tCommon = useTranslations('common');

  // Variant themes mapping
  const themes = {
    default: {
      btnClass: 'bg-stone-850 hover:bg-stone-750 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900',
      badgeClass: 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300',
      Icon: HelpCircle,
    },
    destructive: {
      btnClass: 'bg-red-650 hover:bg-red-750 text-white',
      badgeClass: 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400',
      Icon: AlertTriangle,
    },
    success: {
      btnClass: 'bg-green-800 hover:bg-green-750 text-white',
      badgeClass: 'bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-400',
      Icon: CheckCircle,
    },
  };

  const theme = themes[variant] || themes.default;
  const ActiveIcon = CustomIcon || theme.Icon;

  const handleCancel = () => {
    if (onCancel) onCancel();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <div className="flex flex-col items-center gap-4 py-1 text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${theme.badgeClass}`}>
            <ActiveIcon className="w-6 h-6" />
          </div>
          
          <div className="space-y-1">
            <DialogTitle className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-150">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-stone-500 dark:text-stone-400 font-sans leading-relaxed">
              {description}
            </DialogDescription>
          </div>
          
          <DialogFooter className="flex gap-3 w-full pt-1 sm:justify-center">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {cancelText || tCommon('cancel')}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 h-10 px-4 rounded-xl text-sm font-medium font-sans transition-colors cursor-pointer select-none ${theme.btnClass}`}
            >
              {isLoading && (
                <svg className="animate-spin h-4 w-4 mr-1 inline-block text-current" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {confirmText || tCommon('confirm')}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDialog;
