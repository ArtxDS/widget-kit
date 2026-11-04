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
    const [source, testSource] = await Promise.all([
      readFile(path.join(process.cwd(), component.source), "utf8"),
      component.test
        ? readFile(path.join(process.cwd(), component.test), "utf8")
        : Promise.resolve("No dedicated test file is registered for this component."),
    ]);
    return NextResponse.json({ source, testSource });
  } catch {
    return NextResponse.json(
      { error: "The source or test file is not available in this checkout." },
      { status: 404 },
    );
  }
}
