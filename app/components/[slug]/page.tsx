import { ComponentDetailPage } from "@/components/dashboard/pages";
import { components } from "@/lib/catalog";

export function generateStaticParams() {
  return components.map(({ slug }) => ({ slug }));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ComponentDetailPage slug={slug} />;
}
