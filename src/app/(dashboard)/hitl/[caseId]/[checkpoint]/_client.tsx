"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
export default function HITLCheckpointRedirect() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.caseId as string;
  const checkpoint = params.checkpoint as string;
  useEffect(() => { router.replace(`/decisions/${caseId}/${checkpoint}`); }, [router, caseId, checkpoint]);
  return null;
}
