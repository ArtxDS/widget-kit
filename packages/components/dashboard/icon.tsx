import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Box,
  Check,
  ChevronDown,
  Clock3,
  Code2,
  Copy,
  ExternalLink,
  FileText,
  FlaskConical,
  LayoutGrid,
  ListFilter,
  Menu,
  Monitor,
  Play,
  Plus,
  Search,
  Smartphone,
  Sparkles,
  Tablet,
  X,
  House,
  type LucideIcon,
} from "lucide-react";
import type { SVGProps } from "react";

export type IconName =
  | "overview"
  | "components"
  | "widgets"
  | "play"
  | "tests"
  | "notes"
  | "search"
  | "arrow-right"
  | "arrow-up-right"
  | "sparkles"
  | "clock"
  | "check"
  | "code"
  | "copy"
  | "monitor"
  | "tablet"
  | "phone"
  | "filter"
  | "chevron-down"
  | "external"
  | "plus"
  | "close"
  | "menu"
  | "activity"
  | "book";

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

const icons: Record<IconName, LucideIcon> = {
  overview: House,
  components: Box,
  widgets: LayoutGrid,
  play: Play,
  tests: FlaskConical,
  notes: FileText,
  search: Search,
  "arrow-right": ArrowRight,
  "arrow-up-right": ArrowUpRight,
  sparkles: Sparkles,
  clock: Clock3,
  check: Check,
  code: Code2,
  copy: Copy,
  monitor: Monitor,
  tablet: Tablet,
  phone: Smartphone,
  filter: ListFilter,
  "chevron-down": ChevronDown,
  external: ExternalLink,
  plus: Plus,
  close: X,
  menu: Menu,
  activity: Activity,
  book: BookOpen,
};

export function Icon({ name, size = 18, strokeWidth = 1.8, ...props }: IconProps) {
  const LucideIconComponent = icons[name];
  return (
    <LucideIconComponent
      aria-hidden="true"
      size={size}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}
