import { createAssistantError } from "../core/errors";

export function isAsyncIterable<T>(
  value: unknown,
): value is AsyncIterable<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    Symbol.asyncIterator in value
  );
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw createAssistantError("aborted", "Assistant request aborted.");
  }
}

export function abortableDelay(
  ms: number,
  signal?: AbortSignal,
): Promise<void> {
  if (ms <= 0) {
    throwIfAborted(signal);
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    function onAbort(): void {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(createAssistantError("aborted", "Assistant request aborted."));
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    if (signal?.aborted) {
      onAbort();
      return;
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
