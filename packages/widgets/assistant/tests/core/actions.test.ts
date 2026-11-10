// @vitest-environment node

import { describe, expect, expectTypeOf, it } from "vitest";
import {
  defineAction,
  isActionDefinition,
  isActionResult,
  isActionRisk,
  type ActionRisk,
} from "../../src/core";

describe("action contracts", () => {
  it("infers the action name, input, and output", async () => {
    const action = defineAction({
      name: "echo",
      description: "Echo a value",
      risk: "low",
      execute: (input: { value: string }) => ({
        ok: true as const,
        value: input.value,
      }),
    });

    expectTypeOf(action.name).toEqualTypeOf<"echo">();
    expectTypeOf(action.execute).parameter(0).toEqualTypeOf<{
      value: string;
    }>();

    const result = await action.execute({ value: "hello" }, {});
    expect(result.ok).toBe(true);
    if (result.ok) {
      expectTypeOf(result.value).toEqualTypeOf<string>();
      expect(result.value).toBe("hello");
    }
  });

  it("returns the same definition and accepts valid risks", () => {
    const definition = {
      name: "refresh",
      risk: "medium" as const,
      execute: () => ({ ok: true as const, value: null }),
    };

    expect(defineAction(definition)).toBe(definition);
    expect(isActionRisk("low")).toBe(true);
    expect(isActionRisk("medium")).toBe(true);
    expect(isActionRisk("high")).toBe(true);
    expect(isActionRisk("critical")).toBe(false);
  });

  it("rejects invalid definitions at runtime", () => {
    expect(() =>
      defineAction({
        name: "",
        execute: () => ({ ok: true as const, value: null }),
      }),
    ).toThrow(TypeError);

    expect(() =>
      defineAction({
        name: "danger",
        risk: "critical" as ActionRisk,
        execute: () => ({ ok: true as const, value: null }),
      }),
    ).toThrow(TypeError);

    expect(
      isActionDefinition({
        name: "missing-execute",
        risk: "low",
      }),
    ).toBe(false);
  });

  it("validates action result shapes", () => {
    expect(isActionResult({ ok: true, value: 1 })).toBe(true);
    expect(
      isActionResult({
        ok: false,
        error: { code: "action", message: "Failed" },
      }),
    ).toBe(true);
    expect(isActionResult({ ok: true })).toBe(false);
    expect(isActionResult({ ok: false })).toBe(false);
    expect(isActionResult({ ok: "yes", value: 1 })).toBe(false);
  });
});
