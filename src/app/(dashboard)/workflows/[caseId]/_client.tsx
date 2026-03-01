"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
export default function WorkflowDetailRedirect() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.caseId as string;
  useEffect(() => { router.replace(`/responses/${caseId}`); }, [router, caseId]);
  return null;
}
