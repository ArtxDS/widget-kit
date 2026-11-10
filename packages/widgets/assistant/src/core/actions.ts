import { type AssistantError, isAssistantError } from "./errors";
import { isNonEmptyString, isRecord } from "./validation";

export const ACTION_ACCESS = ["read", "write"] as const;

export type ActionAccess = (typeof ACTION_ACCESS)[number];

export const ACTION_RISKS = ["low", "medium", "high"] as const;

export type ActionRisk = (typeof ACTION_RISKS)[number];

export type ActionContext = {
  signal?: AbortSignal;
  metadata?: Record<string, unknown>;
  toolCallId?: string;
  runId?: string;
};

export type ActionSuccess<T> = { ok: true; value: T };
export type ActionFailure = { ok: false; error: AssistantError };
export type ActionResult<T = unknown> = ActionSuccess<T> | ActionFailure;

export type ActionValidationSuccess<TInput> = {
  ok: true;
  value: TInput;
};

export type ActionValidationFailure = {
  ok: false;
  message?: string;
  details?: Record<string, unknown>;
};

export type ActionValidationResult<TInput> =
  | ActionValidationSuccess<TInput>
  | ActionValidationFailure;

export type ActionValidator<TInput = unknown> = (
  input: unknown,
) => ActionValidationResult<TInput>;

export type ActionHandler<TInput = unknown, TOutput = unknown> = (
  input: TInput,
  context: ActionContext,
) => ActionResult<TOutput> | Promise<ActionResult<TOutput>>;

export type ActionDefinition<
  TName extends string = string,
  TInput = unknown,
  TOutput = unknown,
> = {
  name: TName;
  description?: string;
  /**
   * Read tools may be executed after validation. Write tools always require
   * explicit confirmation. When omitted, the runtime treats the tool as write.
   */
  access?: ActionAccess;
  risk?: ActionRisk;
  validate?: ActionValidator<TInput>;
  execute: ActionHandler<TInput, TOutput>;
};

export type AnyActionDefinition = {
  name: string;
  description?: string;
  access?: ActionAccess;
  risk?: ActionRisk;
  validate?: ActionValidator<unknown>;
  execute: ActionHandler<never, unknown>;
};

export type ToolAccess = ActionAccess;
export type ToolDefinition<
  TName extends string = string,
  TInput = unknown,
  TOutput = unknown,
> = ActionDefinition<TName, TInput, TOutput>;
export type AnyToolDefinition = AnyActionDefinition;

export type ToolValidationResult<TInput = unknown> =
  ActionValidationResult<TInput>;

export function isActionAccess(value: unknown): value is ActionAccess {
  return value === "read" || value === "write";
}

export function isActionRisk(value: unknown): value is ActionRisk {
  return (
    value === "low" || value === "medium" || value === "high"
  );
}

export function isActionDefinition(
  value: unknown,
): value is AnyActionDefinition {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.name) &&
    (value.description === undefined ||
      typeof value.description === "string") &&
    (value.access === undefined || isActionAccess(value.access)) &&
    (value.risk === undefined || isActionRisk(value.risk)) &&
    (value.validate === undefined || typeof value.validate === "function") &&
    typeof value.execute === "function"
  );
}

export function isActionResult(value: unknown): value is ActionResult {
  if (!isRecord(value) || typeof value.ok !== "boolean") return false;
  if (value.ok) return "value" in value;
  return isAssistantError(value.error);
}

export function defineAction<
  const TName extends string,
  TInput = unknown,
  TOutput = unknown,
>(
  definition: ActionDefinition<TName, TInput, TOutput>,
): ActionDefinition<TName, TInput, TOutput> {
  if (!isActionDefinition(definition)) {
    throw new TypeError("defineAction expected a valid action definition.");
  }
  return definition;
}

export const defineTool = defineAction;
export const isToolDefinition = isActionDefinition;
