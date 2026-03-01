import ClientPage from "./_client";

export function generateStaticParams() {
  return [{ id: "_placeholder" , caseId: "_placeholder", checkpoint: "_placeholder", filename: "_placeholder" }];
}

export default function Page() {
  return <ClientPage />;
}
