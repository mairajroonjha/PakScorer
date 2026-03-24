import { notFound } from "next/navigation";
import { PublicMatchCenter } from "@/components/public-match-center";
import { getPublicMatchDetailData, getStaticPublicExportIds } from "@/lib/db-store";

export const dynamicParams = false;

export function generateStaticParams() {
  return getStaticPublicExportIds().matchIds.map((id) => ({ id }));
}

export default async function PublicMatchDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getPublicMatchDetailData(id);

  if (!detail) {
    notFound();
  }

  return <PublicMatchCenter detail={detail} />;
}
