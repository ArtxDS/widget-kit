"use client";

import { forwardRef, useEffect, useRef } from "react";
import {
  Check,
  CheckCircle2,
  CircleX,
  LoaderCircle,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import type { HTMLAttributes } from "react";

export type ToastVariant = "loading" | "success" | "warning" | "error";
export type ToastMode = "normal" | "steps";
export type ToastPlacement = "viewport" | "inline";
export type ToastStepStatus = "complete" | "current" | "pending" | "error";

export type ToastStep = {
  label: string;
  status: ToastStepStatus;
};

export type ToastProps = {
  open: boolean;
  variant: ToastVariant;
  mode?: ToastMode;
  placement?: ToastPlacement;
  title: string;
  description?: string;
  steps?: ToastStep[];
  onClose?: () => void;
  closeLabel?: string;
} & Omit<HTMLAttributes<HTMLElement>, "children">;

const variantIcons: Record<ToastVariant, LucideIcon> = {
  loading: LoaderCircle,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: CircleX,
};

const stepIcons: Partial<Record<ToastStepStatus, LucideIcon>> = {
  complete: Check,
  current: LoaderCircle,
  error: X,
};

export const Toast = forwardRef<HTMLElement, ToastProps>(function Toast(props, ref) {
  const {
    open,
    variant,
    mode = "normal",
    placement = "viewport",
    title,
    description,
    steps = [],
    onClose,
    closeLabel = "Close notification",
    className,
    ...rest
  } = props;

  const VariantIcon = variantIcons[variant];
  const sectionRef = useRef<HTMLElement>(null);

  const setSectionRef = (node: HTMLElement | null) => {
    sectionRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  useEffect(() => {
    sectionRef.current?.toggleAttribute("inert", !open);
  }, [open]);

  useEffect(() => {
    if (!open || !onClose) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <div
      aria-hidden={!open}
      className={`app-toast-viewport${placement === "inline" ? " app-toast-viewport--inline" : ""}`}
    >
      <section
        aria-busy={open && variant === "loading"}
        aria-live={open ? (variant === "error" ? "assertive" : "polite") : undefined}
        className={`app-toast app-toast--${variant} app-toast--${mode}${open ? " is-open" : " is-closed"}${className ? ` ${className}` : ""}`}
        ref={setSectionRef}
        role={open ? (variant === "error" ? "alert" : "status") : undefined}
        {...rest}
      >
        <VariantIcon
          aria-hidden="true"
          className={`app-toast__icon${variant === "loading" ? " is-spinning" : ""}`}
          size={mode === "normal" ? 20 : 22}
          strokeWidth={1.9}
        />
        <div className="app-toast__content">
          <strong className="app-toast__title">{title}</strong>
          {description && <p className="app-toast__description">{description}</p>}
          {mode === "steps" && steps.length > 0 && (
            <ol className="app-toast__steps">
              {steps.map((step, index) => {
                const StepIcon = stepIcons[step.status];
                return (
                  <li
                    className={`app-toast__step app-toast__step--${step.status}`}
                    key={`${index}-${step.label}`}
                  >
                    <span aria-hidden="true" className="app-toast__step-icon">
                      {StepIcon ? (
                        <StepIcon
                          className={step.status === "current" ? "is-spinning" : undefined}
                          size={14}
                          strokeWidth={2}
                        />
                      ) : (
                        <span className="app-toast__step-pending" />
                      )}
                    </span>
                    <span>{step.label}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
        {onClose && (
          <button
            aria-label={closeLabel}
            className="app-toast__close"
            onClick={onClose}
            title={closeLabel}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        )}
      </section>
    </div>
  );
});
