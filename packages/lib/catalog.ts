export type ComponentCategory = "Controls" | "Forms" | "Feedback";

export type ComponentDefinition = {
  slug: string;
  name: string;
  category: ComponentCategory;
  description: string;
  source: string;
  test: string;
};

export type WidgetDefinition = {
  slug: string;
  name: string;
  category: string;
  description: string;
  status: "In development" | "Ready";
  source: string;
};

export const components: ComponentDefinition[] = [
  {
    slug: "badge",
    name: "Badge",
    category: "Feedback",
    description: "A small status label for states, categories, and metadata.",
    source: "packages/components/ui/badge.tsx",
    test: "packages/components/ui/badge.test.tsx",
  },
];

export const widgets: WidgetDefinition[] = [];

export function getComponent(slug: string) {
  return components.find((component) => component.slug === slug);
}
