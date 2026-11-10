// @vitest-environment node

import { describe, expect, expectTypeOf, it } from "vitest";
import {
  defineAction,
  defineAssistant,
  isAssistantConfig,
} from "../../src/core";

describe("assistant config", () => {
  it("infer literal config values and action names", () => {
    const action = defineAction({
      name: "open-settings",
      execute: () => ({ ok: true as const, value: null }),
    });
    const config = defineAssistant({
      id: "kit-assistant",
      name: "Kit Assistant",
      description: "A generic assistant",
      actions: [action],
      metadata: { locale: "en" },
    });

    expectTypeOf(config.id).toEqualTypeOf<"kit-assistant">();
    expectTypeOf(config.name).toEqualTypeOf<"Kit Assistant">();
    expect(config.actions?.[0]).toBe(action);
  });

  it("accepts valid configs", () => {
    expect(
      isAssistantConfig({
        id: "kit-assistant",
        name: "Kit Assistant",
      }),
    ).toBe(true);

    expect(
      isAssistantConfig({
        id: "kit-assistant",
        name: "Kit Assistant",
        actions: [
          {
            name: "refresh",
            execute: () => ({ ok: true, value: null }),
          },
        ],
      }),
    ).toBe(true);
  });

  it("rejects invalid configs", () => {
    expect(isAssistantConfig({ id: "", name: "Assistant" })).toBe(false);
    expect(isAssistantConfig({ id: "assistant", name: " " })).toBe(false);
    expect(
      isAssistantConfig({
        id: "assistant",
        name: "Assistant",
        actions: [{ name: "missing-execute" }],
      }),
    ).toBe(false);
    expect(
      isAssistantConfig({
        id: "assistant",
        name: "Assistant",
        metadata: [],
      }),
    ).toBe(false);
  });

  it("rejects duplicate action names", () => {
    const action = defineAction({
      name: "refresh",
      execute: () => ({ ok: true as const, value: null }),
    });

    expect(() =>
      defineAssistant({
        id: "assistant",
        name: "Assistant",
        actions: [action, action],
      }),
    ).toThrow(TypeError);

    expect(
      isAssistantConfig({
        id: "assistant",
        name: "Assistant",
        actions: [action, action],
      }),
    ).toBe(false);
  });

  it("rejects invalid configs in defineAssistant", () => {
    expect(() =>
      defineAssistant({
        id: "",
        name: "Assistant",
      }),
    ).toThrow(TypeError);
  });
});
