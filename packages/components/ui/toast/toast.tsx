"use client";

import {
  Check,
  CheckCircle2,
  CircleX,
  LoaderCircle,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";

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
};

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

export function Toast({
  open,
  variant,
  mode = "normal",
  placement = "viewport",
  title,
  description,
  steps = [],
  onClose,
}: ToastProps) {
  const VariantIcon = variantIcons[variant];
  return (
    <div
      aria-hidden={!open}
      className={`app-toast-viewport${placement === "inline" ? " app-toast-viewport--inline" : ""}`}
    >
      <section
        aria-busy={open && variant === "loading"}
        aria-live={variant === "error" ? "assertive" : "polite"}
        className={`app-toast app-toast--${variant} app-toast--${mode}${open ? " is-open" : " is-closed"}`}
        inert={!open}
        role={open ? (variant === "error" ? "alert" : "status") : undefined}
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
            aria-label="Close notification"
            className="app-toast__close"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        )}
      </section>
    </div>
  );
}
