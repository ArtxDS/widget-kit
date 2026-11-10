import {
  createAssistantError,
  defineAction,
  type ActionContext,
  type ActionValidationResult,
} from "../src/core";
import { isNonEmptyString, isRecord } from "../src/core/validation";

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      const error = new Error("The operation was aborted.");
      error.name = "AbortError";
      reject(error);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export function createSimulatedTools() {
  const notes = new Map<string, string>([["note-1", "Bem-vindo"]]);
  const calls = { read: 0, write: 0 };

  const validateRead = (input: unknown): ActionValidationResult<{ id: string }> => {
    if (!isRecord(input) || !isNonEmptyString(input.id)) {
      return { ok: false, message: "Informe o id da nota." };
    }
    return { ok: true, value: input as { id: string } };
  };

  const readNote = defineAction({
    name: "read_note",
    description: "Read a simulated note.",
    access: "read",
    risk: "low",
    validate: validateRead,
    execute: async ({ id }: { id: string }, context: ActionContext) => {
      await sleep(20, context.signal);
      if (context.signal?.aborted) {
        const error = new Error("The operation was aborted.");
        error.name = "AbortError";
        throw error;
      }
      const validation = validateRead({ id });
      if (!validation.ok) {
        return {
          ok: false,
          error: createAssistantError("action", validation.message ?? "Invalid parameters."),
        };
      }
      calls.read += 1;
      const text = notes.get(id);
      if (text === undefined) {
        return { ok: false, error: createAssistantError("action", "Nota não encontrada.") };
      }
      return { ok: true, value: { id, text } };
    },
  });

  const validateWrite = (input: unknown): ActionValidationResult<{
    id: string;
    text: string;
  }> => {
    if (
      !isRecord(input) ||
      !isNonEmptyString(input.id) ||
      !isNonEmptyString(input.text)
    ) {
      return { ok: false, message: "Informe id e text." };
    }
    return { ok: true, value: input as { id: string; text: string } };
  };

  const writeNote = defineAction({
    name: "write_note",
    description: "Write a simulated note.",
    access: "write",
    risk: "high",
    validate: validateWrite,
    execute: async ({ id, text }: { id: string; text: string }) => {
      const validation = validateWrite({ id, text });
      if (!validation.ok) {
        return {
          ok: false,
          error: createAssistantError("action", validation.message ?? "Invalid parameters."),
        };
      }
      await sleep(20);
      calls.write += 1;
      notes.set(id, text);
      return { ok: true, value: { id, text } };
    },
  });

  return { tools: [readNote, writeNote], notes, calls };
}
