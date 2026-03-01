import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, PackageOpen } from "lucide-react";

interface AsyncStateProps {
  isLoading?: boolean;
  error?: Error | null | unknown;
  isEmpty?: boolean;
  loadingFallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  emptyFallback?: React.ReactNode;
  children: React.ReactNode;
}

export function AsyncState({ isLoading, error, isEmpty, loadingFallback, errorFallback, emptyFallback, children }: AsyncStateProps) {
  if (isLoading) {
    return loadingFallback ?? (
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }
  if (error) {
    return errorFallback ?? (
      <div className="flex items-center gap-2 p-4 text-destructive text-sm">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Une erreur est survenue lors du chargement.</span>
      </div>
    );
  }
  if (isEmpty) {
    return emptyFallback ?? (
      <div className="flex flex-col items-center gap-2 p-8 text-muted-foreground">
        <PackageOpen className="h-8 w-8" />
        <p className="text-sm">Aucune donnee disponible.</p>
      </div>
    );
  }
  return children;
}
