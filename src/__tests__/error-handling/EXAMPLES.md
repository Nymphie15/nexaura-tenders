# Exemples d'Utilisation - Gestion des Erreurs

Guide pratique d'utilisation des composants de gestion d'erreurs et des patterns testés.

## Table des Matières

1. [Error Boundary Personnalisé](#error-boundary-personnalisé)
2. [Pages d'Erreur Next.js](#pages-derreur-nextjs)
3. [Loading States](#loading-states)
4. [Skeletons Accessibles](#skeletons-accessibles)
5. [Indicateur Hors Ligne](#indicateur-hors-ligne)
6. [Patterns Avancés](#patterns-avancés)

---

## Error Boundary Personnalisé

### Utilisation Basique

```tsx
import { ErrorBoundary } from '@/components/error-boundary';

function MyApp() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### Avec Fallback Personnalisé

```tsx
import { ErrorBoundary } from '@/components/error-boundary';

function MyApp() {
  return (
    <ErrorBoundary
      fallback={(error, retry) => (
        <div className="error-container">
          <h2>Oups ! Quelque chose s'est mal passé</h2>
          <p>{error.message}</p>
          <button onClick={retry}>Réessayer</button>
        </div>
      )}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### Avec Callback onError

```tsx
import { ErrorBoundary } from '@/components/error-boundary';

function MyApp() {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Envoyer à Sentry, LogRocket, etc.
    console.error('Error caught:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // Envoyer au backend
    fetch('/api/log-error', {
      method: 'POST',
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      }),
    });
  };

  return (
    <ErrorBoundary onError={handleError}>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### Reset Automatique avec resetKeys

```tsx
import { ErrorBoundary } from '@/components/error-boundary';

function UserProfile({ userId }: { userId: string }) {
  return (
    <ErrorBoundary resetKeys={[userId]}>
      {/* L'error boundary se réinitialise automatiquement quand userId change */}
      <UserDetails userId={userId} />
    </ErrorBoundary>
  );
}
```

### Utilisation du Hook useErrorHandler

```tsx
import { useErrorHandler } from '@/components/error-boundary';
import { useQuery } from '@tanstack/react-query';

function DataComponent() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
  });

  // Lance l'erreur vers le ErrorBoundary parent
  useErrorHandler(error);

  if (isLoading) return <Skeleton />;

  return <div>{data}</div>;
}

// Wrapper avec ErrorBoundary
function App() {
  return (
    <ErrorBoundary>
      <DataComponent />
    </ErrorBoundary>
  );
}
```

---

## Pages d'Erreur Next.js

### Structure Recommandée

```
app/
├── error.tsx                 # Erreur globale (toute l'app)
├── (dashboard)/
│   ├── error.tsx            # Erreur dashboard
│   └── tenders/
│       └── error.tsx        # Erreur spécifique aux appels d'offres
```

### Erreur Globale avec Logging

```tsx
// app/error.tsx
'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Logger vers Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <ErrorUI error={error} reset={reset} />
      </body>
    </html>
  );
}
```

### Erreur avec Navigation Contextuelle

```tsx
// app/(dashboard)/error.tsx
'use client';

import { useRouter, usePathname } from 'next/navigation';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleGoBack = () => {
    // Retour intelligent basé sur le chemin
    if (pathname.includes('/tenders/')) {
      router.push('/tenders');
    } else {
      router.back();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Erreur de chargement</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={reset}>Réessayer</Button>
        <Button variant="outline" onClick={handleGoBack}>
          Retour
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## Loading States

### Dashboard Loading avec Skeletons

```tsx
// app/(dashboard)/loading.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### Loading State Conditionnel

```tsx
import { Suspense } from 'react';
import DashboardLoading from './loading';

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
```

---

## Skeletons Accessibles

### Skeleton Simple

```tsx
import { AccessibleSkeleton } from '@/components/ui/accessible-skeleton';

function LoadingCard() {
  return (
    <Card>
      <CardHeader>
        <AccessibleSkeleton
          variant="text"
          label="Chargement du titre"
        />
      </CardHeader>
      <CardContent>
        <AccessibleSkeleton
          variant="card"
          label="Chargement du contenu"
        />
      </CardContent>
    </Card>
  );
}
```

### Skeleton de Tableau

```tsx
import { TableSkeleton } from '@/components/ui/accessible-skeleton';

function LoadingTable() {
  return (
    <div className="p-6">
      <TableSkeleton
        rows={10}
        columns={5}
        label="Chargement de la liste des appels d'offres"
      />
    </div>
  );
}
```

### Skeleton de Dashboard Complet

```tsx
import { DashboardSkeleton } from '@/components/ui/accessible-skeleton';

function LoadingDashboard() {
  return <DashboardSkeleton />;
}
```

### Skeleton Personnalisé

```tsx
import { AccessibleSkeleton } from '@/components/ui/accessible-skeleton';

function CustomSkeleton() {
  return (
    <div className="space-y-4">
      {/* Avatar + Nom */}
      <div className="flex items-center gap-4">
        <AccessibleSkeleton
          variant="avatar"
          label="Photo de profil"
        />
        <div className="flex-1 space-y-2">
          <AccessibleSkeleton
            variant="text"
            className="w-48"
            label="Nom"
          />
          <AccessibleSkeleton
            variant="text"
            className="w-32 h-3"
            label="Email"
          />
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-2">
        <AccessibleSkeleton variant="button" label="Action 1" />
        <AccessibleSkeleton variant="button" label="Action 2" />
      </div>
    </div>
  );
}
```

---

## Indicateur Hors Ligne

### Utilisation de Base

```tsx
// app/layout.tsx
import { OfflineIndicator } from '@/components/offline-indicator';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <OfflineIndicator />
        {children}
      </body>
    </html>
  );
}
```

### Détection Manuelle

```tsx
'use client';

import { useEffect, useState } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Utilisation
function MyComponent() {
  const isOnline = useOnlineStatus();

  if (!isOnline) {
    return <div>Vous êtes hors ligne</div>;
  }

  return <div>Contenu normal</div>;
}
```

---

## Patterns Avancés

### Cascade d'Error Boundaries

```tsx
import { ErrorBoundary } from '@/components/error-boundary';

function App() {
  return (
    <ErrorBoundary
      fallback={(error) => <GlobalErrorFallback error={error} />}
      onError={(error) => console.error('Global error:', error)}
    >
      <Layout>
        <ErrorBoundary
          fallback={(error) => <SectionErrorFallback error={error} />}
        >
          <Dashboard>
            <ErrorBoundary
              fallback={(error) => <WidgetErrorFallback error={error} />}
            >
              <Widget />
            </ErrorBoundary>
          </Dashboard>
        </ErrorBoundary>
      </Layout>
    </ErrorBoundary>
  );
}
```

### Error Boundary avec Retry Automatique

```tsx
import { ErrorBoundary } from '@/components/error-boundary';
import { useState } from 'react';

function AutoRetryBoundary({ children }) {
  const [retryCount, setRetryCount] = useState(0);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  const handleError = (error: Error) => {
    if (retryCount < 3) {
      // Retry avec exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      setRetryAfter(Date.now() + delay);
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setRetryAfter(null);
      }, delay);
    }
  };

  const reset = () => {
    setRetryCount(0);
    setRetryAfter(null);
  };

  return (
    <ErrorBoundary
      resetKeys={[retryCount]}
      onError={handleError}
      fallback={(error, retry) => (
        <div>
          <p>Erreur: {error.message}</p>
          {retryCount < 3 ? (
            <p>Nouvelle tentative dans {retryAfter ? Math.ceil((retryAfter - Date.now()) / 1000) : 0}s...</p>
          ) : (
            <>
              <p>Échec après 3 tentatives</p>
              <button onClick={reset}>Réinitialiser</button>
            </>
          )}
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### Loading State avec Timeout

```tsx
'use client';

import { useState, useEffect } from 'react';
import { AccessibleSkeleton } from '@/components/ui/accessible-skeleton';

function LoadingWithTimeout({
  children,
  timeout = 10000
}: {
  children: React.ReactNode;
  timeout?: number;
}) {
  const [isTimeout, setIsTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTimeout(true);
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout]);

  if (isTimeout) {
    return (
      <div className="p-6 text-center">
        <p>Le chargement prend plus de temps que prévu...</p>
        <button onClick={() => window.location.reload()}>
          Rafraîchir la page
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

// Utilisation
function MyPage() {
  return (
    <Suspense fallback={
      <LoadingWithTimeout timeout={10000}>
        <AccessibleSkeleton variant="card" />
      </LoadingWithTimeout>
    }>
      <SlowComponent />
    </Suspense>
  );
}
```

### Empty State avec Fallback

```tsx
function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: {
  icon: any;
  title: string;
  description: string;
  action?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {action && (
        <button onClick={action} className="btn-primary">
          Commencer
        </button>
      )}
    </div>
  );
}

// Utilisation
function TendersList({ tenders }: { tenders: Tender[] }) {
  if (tenders.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Aucun appel d'offres"
        description="Vous n'avez pas encore d'appels d'offres. Créez-en un pour commencer."
        action={() => router.push('/tenders/new')}
      />
    );
  }

  return (
    <div>
      {tenders.map(tender => (
        <TenderCard key={tender.id} tender={tender} />
      ))}
    </div>
  );
}
```

### Error Tracking avec Analytics

```tsx
import { ErrorBoundary } from '@/components/error-boundary';
import * as Sentry from '@sentry/nextjs';
import posthog from 'posthog-js';

function TrackedErrorBoundary({ children }: { children: React.ReactNode }) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    // PostHog
    posthog.capture('error_boundary_triggered', {
      error_message: error.message,
      error_stack: error.stack,
      component_stack: errorInfo.componentStack,
    });

    // Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      });
    }
  };

  return (
    <ErrorBoundary onError={handleError}>
      {children}
    </ErrorBoundary>
  );
}
```

---

## Checklist d'Implémentation

### Error Handling
- [ ] ErrorBoundary au niveau racine de l'app
- [ ] ErrorBoundary pour chaque section majeure
- [ ] error.tsx pour chaque route importante
- [ ] Logging centralisé des erreurs
- [ ] Messages d'erreur user-friendly
- [ ] Boutons de récupération clairs

### Loading States
- [ ] loading.tsx pour chaque route
- [ ] Skeletons accessibles (ARIA)
- [ ] Indicateurs de progression
- [ ] Timeout pour chargements longs
- [ ] Empty states pour données vides

### Offline Support
- [ ] OfflineIndicator visible
- [ ] Détection online/offline
- [ ] Service Worker sync
- [ ] Messages clairs pour l'utilisateur
- [ ] Graceful degradation

### Accessibilité
- [ ] role="status" sur skeletons
- [ ] aria-live pour changements dynamiques
- [ ] aria-label descriptifs
- [ ] Texte sr-only pour lecteurs d'écran
- [ ] Navigation au clavier fonctionnelle

---

**Dernière mise à jour:** 2026-01-25
