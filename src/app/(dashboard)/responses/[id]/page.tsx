import { redirect } from "next/navigation";

export function generateStaticParams() {
  return [{ id: "_placeholder" , caseId: "_placeholder", checkpoint: "_placeholder", filename: "_placeholder" }];
}

export default async function ResponseDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/projects/${id}`);
}
