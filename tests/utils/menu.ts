import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

export async function selectMenuOption(
  user: UserEvent,
  menuName: string | RegExp,
  optionName: string | RegExp,
): Promise<void> {
  await user.click(screen.getByRole("button", { name: menuName }));
  await user.click(await screen.findByRole("menuitemradio", { name: optionName }));
}
