import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getComponent } from "@/lib/catalog";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/components/[slug]/source">,
) {
  const { slug } = await context.params;
  const component = getComponent(slug);
  if (!component) return NextResponse.json({ error: "Component not found." }, { status: 404 });

  try {
    const componentDirectory = path.join(process.cwd(), "packages", "components", "ui");
    const [source, testSource] = await Promise.all([
      readFile(path.join(componentDirectory, `${component.slug}.tsx`), "utf8"),
      readFile(path.join(componentDirectory, `${component.slug}.test.tsx`), "utf8"),
    ]);
    return NextResponse.json({ source, testSource });
  } catch {
    return NextResponse.json(
      { error: "The source or test file is not available in this checkout." },
      { status: 404 },
    );
  }
}
