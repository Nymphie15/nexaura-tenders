"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function HITLRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/decisions"); }, [router]);
  return null;
}
