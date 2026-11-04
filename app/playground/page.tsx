import { Suspense } from "react";
import { PlaygroundPage } from "@/components/dashboard/pages";

async function PlaygroundContent({
  searchParams,
}: {
  searchParams: Promise<{ item?: string }>;
}) {
  const { item } = await searchParams;
  return <PlaygroundPage initialItem={item} />;
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ item?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <PlaygroundContent searchParams={searchParams} />
    </Suspense>
  );
}
