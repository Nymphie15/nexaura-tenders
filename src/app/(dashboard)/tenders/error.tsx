"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, FileText } from "lucide-react";

export default function TendersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log error to monitoring service
    console.error("Tenders page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-red-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">Erreur de chargement des appels d'offres</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Impossible de charger la liste des appels d'offres. Cela peut être dû à un problème de
            connexion ou un problème temporaire du serveur.
          </p>

          {process.env.NODE_ENV === "development" && error.message && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-xs font-mono text-red-800 break-all">{error.message}</p>
              {error.digest && (
                <p className="text-xs text-red-600 mt-2">Error ID: {error.digest}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">Suggestions :</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Vérifiez votre connexion internet</li>
              <li>Rechargez la page</li>
              <li>Réessayez dans quelques instants</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={reset}
              className="w-full gap-2"
              aria-label="Réessayer le chargement des appels d'offres"
            >
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full gap-2"
              aria-label="Retour au tableau de bord"
            >
              <FileText className="h-4 w-4" />
              Retour au tableau de bord
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
