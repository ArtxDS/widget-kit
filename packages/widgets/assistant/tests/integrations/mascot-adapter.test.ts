// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import {
  ASSISTANT_MASCOT_MOOD_MAP,
  ASSISTANT_MASCOT_MOODS,
  assistantMascotMoodForStatus,
  applyAssistantStatusToMascot,
  createAssistantMascotMoodSync,
} from "../../src/integrations/mascot";

describe("assistant mascot adapter", () => {
  it("maps assistant statuses to mascot moods", () => {
    expect(ASSISTANT_MASCOT_MOOD_MAP).toMatchObject({
      idle: "idle",
      submitting: "thinking",
      thinking: "thinking",
      streaming: "speaking",
      "executing-tool": "thinking",
      "awaiting-confirmation": "confused",
      error: "error",
    });
    expect(assistantMascotMoodForStatus("idle")).toBe("idle");
    expect(assistantMascotMoodForStatus("thinking")).toBe("thinking");
    expect(assistantMascotMoodForStatus("streaming")).toBe("speaking");
    expect(assistantMascotMoodForStatus("awaiting-confirmation")).toBe("confused");
    expect(assistantMascotMoodForStatus("error")).toBe("error");
  });

  it("defines thinking and speaking moods", () => {
    expect(ASSISTANT_MASCOT_MOODS.thinking).toMatchObject({
      eyes: "dots",
      mouth: "flat",
      fx: "question",
    });
    expect(ASSISTANT_MASCOT_MOODS.speaking).toMatchObject({
      eyes: "happy",
      mouth: "omega-big",
      arms: "wave-right",
    });
  });

  it("applies a mood to the mascot instance", () => {
    const setMood = vi.fn();
    const instance = { setMood };

    const mood = applyAssistantStatusToMascot(instance, "streaming");

    expect(mood).toBe("speaking");
    expect(setMood).toHaveBeenCalledWith("speaking");
  });

  it("can speak and return to idle with one sync object", () => {
    const setMood = vi.fn();
    const say = vi.fn();
    const sync = createAssistantMascotMoodSync(() => ({ setMood, say }));

    expect(sync.speak("Olá, eu sou o Wallet Hub Assistant.")).toBe("speaking");
    expect(say).toHaveBeenCalledWith({ text: "Olá, eu sou o Wallet Hub Assistant." });
    expect(sync.sync("idle")).toBe("idle");
    expect(sync.lastMood()).toBe("idle");
    expect(setMood).toHaveBeenLastCalledWith("idle");
  });

  it("does not call setMood when the mascot instance is unavailable", () => {
    const sync = createAssistantMascotMoodSync(() => null);

    expect(sync.sync("thinking")).toBe("thinking");
  });
});
