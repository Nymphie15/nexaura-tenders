"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      // Enregistrer le Service Worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[SW] Registered successfully:", registration.scope);

          // Vérifier les mises à jour toutes les heures
          setInterval(
            () => {
              registration.update();
            },
            60 * 60 * 1000
          );

          // Gérer les mises à jour
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;

            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // Un nouveau Service Worker est disponible
                  console.log("[SW] New version available");

                  // Vous pouvez afficher une notification à l'utilisateur ici
                  if (
                    confirm(
                      "Une nouvelle version de l'application est disponible. Recharger maintenant ?"
                    )
                  ) {
                    newWorker.postMessage({ type: "SKIP_WAITING" });
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("[SW] Registration failed:", error);
        });

      // Gérer le contrôle par un nouveau SW
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("[SW] Controller changed, reloading...");
        window.location.reload();
      });
    }
  }, []);

  return null; // Ce composant ne rend rien
}
