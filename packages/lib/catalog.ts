export type ComponentCategory = "Controls" | "Forms" | "Feedback";

export type ComponentDefinition = {
  slug: string;
  name: string;
  category: ComponentCategory;
  description: string;
  source: string;
  test?: string;
};

export type WidgetDefinition = {
  slug: string;
  name: string;
  category: string;
  description: string;
  status: "In development" | "Ready";
  source: string;
  test: string;
};

export const components: ComponentDefinition[] = [
  {
    slug: "badge",
    name: "Badge",
    category: "Feedback",
    description: "A small status label for states, categories, and metadata.",
    source: "packages/components/ui/badge/badge.tsx",
    test: "packages/components/ui/badge/badge.test.tsx",
  },
  {
    slug: "toast",
    name: "Toast",
    category: "Feedback",
    description: "A compact notification with loading, success, warning, error, and step states.",
    source: "packages/components/ui/toast/toast.tsx",
  },
];

export const widgets: WidgetDefinition[] = [
  {
    slug: "mascot",
    name: "Mascot",
    category: "Feedback",
    description:
      "Animated robot mascot that follows the pointer, blinks, waves, and reacts to host events.",
    status: "Ready",
    source: "packages/widgets/mascot/src",
    test: "packages/widgets/mascot/tests",
  },
];

export function getComponent(slug: string) {
  return components.find((component) => component.slug === slug);
}

export function getWidget(slug: string) {
  return widgets.find((widget) => widget.slug === slug);
}
