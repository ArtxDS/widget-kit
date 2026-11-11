"use client";

import { Toast } from "./toast";
import type {
  ToastMode,
  ToastPlacement,
  ToastStep,
  ToastVariant,
} from "./toast";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastOptions = {
  id?: string;
  variant?: ToastVariant;
  title: string;
  description?: string;
  mode?: ToastMode;
  placement?: ToastPlacement;
  steps?: ToastStep[];
  duration?: number | null;
  onClose?: () => void;
};

type ActiveToast = {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  mode: ToastMode;
  placement: ToastPlacement;
  steps: ToastStep[];
  duration: number | null;
  onClose?: () => void;
};

type ToastContextValue = {
  toast: (options: ToastOptions) => string;
  success: (title: string, options?: Omit<ToastOptions, "title" | "variant">) => string;
  error: (title: string, options?: Omit<ToastOptions, "title" | "variant">) => string;
  warning: (title: string, options?: Omit<ToastOptions, "title" | "variant">) => string;
  info: (title: string, options?: Omit<ToastOptions, "title" | "variant">) => string;
  loading: (title: string, options?: Omit<ToastOptions, "title" | "variant">) => string;
  update: (id: string, options: Partial<ToastOptions>) => void;
  dismiss: (id?: string) => void;
  showToast: (options: ToastOptions) => string;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 6000;

function createToastId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function resolveDuration(variant: ToastVariant, duration?: number | null, fallback = DEFAULT_DURATION) {
  if (duration === null) return null;
  if (duration === 0) return null;
  if (duration !== undefined) return duration;
  if (variant === "loading") return null;
  return fallback;
}

export function ToastProvider({
  children,
  defaultDuration = DEFAULT_DURATION,
}: {
  children: ReactNode;
  defaultDuration?: number;
}) {
  const [activeToast, setActiveToast] = useState<ActiveToast | null>(null);
  const activeToastRef = useRef<ActiveToast | null>(null);
  const dismissTimer = useRef<number | null>(null);

  useEffect(() => {
    activeToastRef.current = activeToast;
  }, [activeToast]);

  const clearTimer = useCallback(() => {
    if (dismissTimer.current !== null) {
      window.clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  const dismiss = useCallback(
    (id?: string) => {
      clearTimer();
      setActiveToast((current) => {
        if (!current) return current;
        if (id && current.id !== id) return current;
        current.onClose?.();
        activeToastRef.current = null;
        return null;
      });
    },
    [clearTimer],
  );

  const schedule = useCallback(
    (toast: ActiveToast) => {
      clearTimer();
      const delay = toast.duration === null ? null : toast.duration ?? defaultDuration;
      if (delay === null) return;
      dismissTimer.current = window.setTimeout(() => {
        dismiss(toast.id);
      }, delay > 0 ? delay : defaultDuration);
    },
    [clearTimer, defaultDuration, dismiss],
  );

  const toast = useCallback(
    (options: ToastOptions) => {
      const variant = options.variant ?? "success";
      const current = activeToastRef.current;

      if (
        current &&
        options.id === undefined &&
        current.variant === variant &&
        current.title === options.title &&
        current.description === options.description
      ) {
        return current.id;
      }

      const id = options.id ?? (current?.id && options.id === current.id ? current.id : createToastId());
      const targetId = options.id ?? id;

      if (current && current.id === targetId) {
        const next: ActiveToast = {
          ...current,
          variant,
          title: options.title,
          description: options.description ?? current.description,
          mode: options.mode ?? current.mode,
          placement: options.placement ?? current.placement,
          steps: options.steps ?? current.steps,
          duration: resolveDuration(variant, options.duration, defaultDuration),
          onClose: options.onClose ?? current.onClose,
        };
        activeToastRef.current = next;
        setActiveToast(next);
        schedule(next);
        return targetId;
      }

      const next: ActiveToast = {
        id: targetId,
        variant,
        title: options.title,
        description: options.description,
        mode: options.mode ?? "normal",
        placement: options.placement ?? "viewport",
        steps: options.steps ?? [],
        duration: resolveDuration(variant, options.duration, defaultDuration),
        onClose: options.onClose,
      };
      activeToastRef.current = next;
      setActiveToast(next);
      schedule(next);
      return targetId;
    },
    [defaultDuration, schedule],
  );

  const update = useCallback(
    (id: string, options: Partial<ToastOptions>) => {
      const current = activeToastRef.current;
      if (!current || current.id !== id) return;
      const variant = options.variant ?? current.variant;
      const next: ActiveToast = {
        ...current,
        variant,
        title: options.title ?? current.title,
        description: options.description ?? current.description,
        mode: options.mode ?? current.mode,
        placement: options.placement ?? current.placement,
        steps: options.steps ?? current.steps,
        duration: resolveDuration(variant, options.duration ?? current.duration, defaultDuration),
        onClose: options.onClose ?? current.onClose,
      };
      activeToastRef.current = next;
      setActiveToast(next);
      schedule(next);
    },
    [defaultDuration, schedule],
  );

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const value: ToastContextValue = {
    toast,
    success: (title, options) => toast({ ...options, title, variant: "success" }),
    error: (title, options) => toast({ ...options, title, variant: "error" }),
    warning: (title, options) => toast({ ...options, title, variant: "warning" }),
    info: (title, options) => toast({ ...options, title, variant: "info" }),
    loading: (title, options) => toast({ ...options, title, variant: "loading" }),
    update,
    dismiss,
    showToast: (options) => toast(options),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {activeToast && (
        <Toast
          description={activeToast.description}
          mode={activeToast.mode}
          onClose={() => dismiss(activeToast.id)}
          open
          placement={activeToast.placement}
          steps={activeToast.steps}
          title={activeToast.title}
          variant={activeToast.variant}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }
  return context;
}

export type { ToastContextValue };
