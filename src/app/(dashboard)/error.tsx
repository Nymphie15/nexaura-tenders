"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log error to monitoring service
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-red-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">Erreur de chargement</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Une erreur est survenue lors du chargement de cette page. Veuillez réessayer.
          </p>

          {process.env.NODE_ENV === "development" && error.message && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-xs font-mono text-red-800 break-all">{error.message}</p>
              {error.digest && (
                <p className="text-xs text-red-600 mt-2">Error ID: {error.digest}</p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={reset}
              className="flex-1 gap-2"
              aria-label="Réessayer"
            >
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 gap-2"
              aria-label="Retour en arrière"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="w-full gap-2"
            aria-label="Retour au tableau de bord"
          >
            <Home className="h-4 w-4" />
            Tableau de bord
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
