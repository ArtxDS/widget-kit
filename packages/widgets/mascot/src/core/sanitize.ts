import createDOMPurify from "dompurify";

export function sanitizeSvg(svg: string): string {
  if (typeof window === "undefined") return svg;

  return createDOMPurify(window).sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
  });
}
