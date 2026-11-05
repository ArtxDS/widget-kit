import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import type { ReactElement } from "react";
import { QualityProvider } from "@/components/dashboard/quality/quality-provider";

export type RenderWithQualityResult = RenderResult & {
  user: UserEvent;
};

export function renderWithQuality(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
): RenderWithQualityResult {
  return {
    user: userEvent.setup(),
    ...render(<QualityProvider>{ui}</QualityProvider>, options),
  };
}
