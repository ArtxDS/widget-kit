import {
  type AnyActionDefinition,
  isActionDefinition,
} from "./actions";
import { isNonEmptyString, isRecord } from "./validation";

export type AssistantConfig = {
  id: string;
  name: string;
  description?: string;
  actions?: readonly AnyActionDefinition[];
  metadata?: Record<string, unknown>;
};

export function isAssistantConfig(value: unknown): value is AssistantConfig {
  if (!isRecord(value)) return false;
  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.name) ||
    (value.description !== undefined &&
      typeof value.description !== "string") ||
    (value.metadata !== undefined && !isRecord(value.metadata))
  ) {
    return false;
  }
  if (value.actions === undefined) return true;
  if (!Array.isArray(value.actions)) return false;

  const names = new Set<string>();
  for (const action of value.actions) {
    if (!isActionDefinition(action) || names.has(action.name)) return false;
    names.add(action.name);
  }
  return true;
}

export function defineAssistant<const TConfig extends AssistantConfig>(
  config: TConfig,
): TConfig {
  if (!isAssistantConfig(config)) {
    throw new TypeError("defineAssistant expected a valid assistant config.");
  }
  return config;
}
