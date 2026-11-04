import { describe, expect, it } from "vitest";
import { DEFAULT_MOODS } from "../src/core/moods";
import {
  activeMood,
  applyMood,
  createMoodMachine,
  expireTransient,
  resolveNamed,
} from "../src/core/state";

describe("mood state machine", () => {
  it("returns to the base mood after a transient expires", () => {
    let machine = createMoodMachine("idle");
    machine = applyMood(machine, "happy", DEFAULT_MOODS.happy, 0);
    expect(activeMood(machine, 100)).toBe("happy");
    expect(activeMood(machine, 2600)).toBe("idle");
  });

  it("does not let a lower-priority transient interrupt a higher one", () => {
    let machine = createMoodMachine("idle");
    machine = applyMood(machine, "error", DEFAULT_MOODS.error, 0);
    machine = applyMood(machine, "greeting", DEFAULT_MOODS.greeting, 10);
    expect(activeMood(machine, 20)).toBe("error");
  });

  it("lets a higher-priority transient replace a lower one", () => {
    let machine = createMoodMachine("idle");
    machine = applyMood(machine, "happy", DEFAULT_MOODS.happy, 0);
    machine = applyMood(machine, "error", DEFAULT_MOODS.error, 10);
    expect(activeMood(machine, 20)).toBe("error");
  });

  it("keeps loading until it is resolved by name", () => {
    let machine = createMoodMachine("idle");
    machine = applyMood(machine, "loading", DEFAULT_MOODS.loading, 0, null);
    expect(activeMood(machine, 10_000)).toBe("loading");
    machine = resolveNamed(machine, ["loading"], 10_001);
    expect(activeMood(machine, 10_002)).toBe("idle");
  });

  it("ends loading after the safety timeout", () => {
    let machine = createMoodMachine("idle");
    machine = applyMood(machine, "loading", DEFAULT_MOODS.loading, 0);
    expect(activeMood(machine, 29_000)).toBe("loading");
    machine = expireTransient(machine, 30_001);
    expect(activeMood(machine, 30_001)).toBe("idle");
  });

  it("treats base moods as sticky until replaced", () => {
    let machine = createMoodMachine("idle");
    machine = applyMood(machine, "serious", DEFAULT_MOODS.serious, 0);
    expect(activeMood(machine, 50_000)).toBe("serious");
    machine = applyMood(machine, "hungry", DEFAULT_MOODS.hungry, 50_001);
    expect(activeMood(machine, 50_002)).toBe("hungry");
  });
});
