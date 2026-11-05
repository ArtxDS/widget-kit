import { Suspense } from "react";
import { PlaygroundPage } from "@/components/dashboard/pages";

async function PlaygroundContent({
  searchParams,
}: {
  searchParams: Promise<{ item?: string; mode?: string }>;
}) {
  const { item, mode } = await searchParams;
  return <PlaygroundPage initialItem={item} initialMode={mode === "preview" ? "preview" : "playground"} />;
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ item?: string; mode?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <PlaygroundContent searchParams={searchParams} />
    </Suspense>
  );
}
