'use client';

import React from 'react';
import { toast as sonnerToast } from 'sonner';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ShieldAlert,
  X,
  ExternalLink,
} from 'lucide-react';

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'amber' | 'secondary' | 'danger';
}

export interface CustomToastOptions {
  description?: string;
  action?: ToastAction;
  secondaryAction?: ToastAction;
  duration?: number;
  id?: string | number;
}

interface ToastCardProps {
  id: string | number;
  type: 'success' | 'error' | 'warning' | 'info' | 'hitl';
  title: string;
  description?: string;
  action?: ToastAction;
  secondaryAction?: ToastAction;
}

function ToastCard({
  id,
  type,
  title,
  description,
  action,
  secondaryAction,
}: ToastCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />;
      case 'hitl':
        return <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30 bg-slate-950/95 shadow-emerald-950/30';
      case 'error':
        return 'border-rose-500/30 bg-slate-950/95 shadow-rose-950/30';
      case 'warning':
        return 'border-amber-500/30 bg-slate-950/95 shadow-amber-950/30';
      case 'hitl':
        return 'border-amber-500/40 bg-slate-950/95 shadow-amber-950/40';
      default:
        return 'border-indigo-500/30 bg-slate-950/95 shadow-indigo-950/30';
    }
  };

  const getButtonStyles = (variant: ToastAction['variant'] = 'primary') => {
    switch (variant) {
      case 'amber':
        return 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold';
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-500 text-white font-semibold';
      case 'secondary':
        return 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700';
      case 'primary':
      default:
        return 'bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/20';
    }
  };

  return (
    <div
      className={`w-full max-w-sm rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all ${getBorderColor()}`}
    >
      <div className="flex items-start gap-3">
        {getIcon()}

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-2">
            <h5 className="text-xs font-bold text-white leading-tight truncate">
              {title}
            </h5>
            <button
              onClick={() => sonnerToast.dismiss(id)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {description && (
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              {description}
            </p>
          )}

          {(action || secondaryAction) && (
            <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-800/80">
              {action && (
                <button
                  type="button"
                  onClick={() => {
                    action.onClick();
                    sonnerToast.dismiss(id);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all active:scale-[0.98] ${getButtonStyles(
                    action.variant
                  )}`}
                >
                  <span>{action.label}</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </button>
              )}

              {secondaryAction && (
                <button
                  type="button"
                  onClick={() => {
                    secondaryAction.onClick();
                    sonnerToast.dismiss(id);
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  {secondaryAction.label}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const appToast = {
  success: (title: string, options?: CustomToastOptions) => {
    return sonnerToast.custom(
      (id) => (
        <ToastCard
          id={id}
          type="success"
          title={title}
          description={options?.description}
          action={options?.action}
          secondaryAction={options?.secondaryAction}
        />
      ),
      { duration: options?.duration || 4000, id: options?.id }
    );
  },

  error: (title: string, options?: CustomToastOptions) => {
    return sonnerToast.custom(
      (id) => (
        <ToastCard
          id={id}
          type="error"
          title={title}
          description={options?.description}
          action={options?.action}
          secondaryAction={options?.secondaryAction}
        />
      ),
      { duration: options?.duration || 5000, id: options?.id }
    );
  },

  warning: (title: string, options?: CustomToastOptions) => {
    return sonnerToast.custom(
      (id) => (
        <ToastCard
          id={id}
          type="warning"
          title={title}
          description={options?.description}
          action={options?.action}
          secondaryAction={options?.secondaryAction}
        />
      ),
      { duration: options?.duration || 4500, id: options?.id }
    );
  },

  info: (title: string, options?: CustomToastOptions) => {
    return sonnerToast.custom(
      (id) => (
        <ToastCard
          id={id}
          type="info"
          title={title}
          description={options?.description}
          action={options?.action}
          secondaryAction={options?.secondaryAction}
        />
      ),
      { duration: options?.duration || 4000, id: options?.id }
    );
  },

  hitl: (title: string, options?: CustomToastOptions) => {
    return sonnerToast.custom(
      (id) => (
        <ToastCard
          id={id}
          type="hitl"
          title={title}
          description={options?.description}
          action={options?.action}
          secondaryAction={options?.secondaryAction}
        />
      ),
      { duration: options?.duration || 10000, id: options?.id }
    );
  },

  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
};

