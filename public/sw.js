// Service Worker pour PWA et Push Notifications
// Version: 2.0.0 - Notifications intelligentes

const CACHE_NAME = "ao-auto-v2";
const OFFLINE_URL = "/offline.html";

// Assets a precacher au premier chargement
const PRECACHE_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.json",
];

// ============================================
// Installation - Precache les assets critiques
// ============================================
self.addEventListener("install", (event) => {
  console.log("[SW] Installing v2...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Precaching assets");
      return cache.addAll(PRECACHE_ASSETS);
    })
  );

  // Force le nouveau SW a devenir actif immediatement
  self.skipWaiting();
});

// ============================================
// Activation - Nettoie les anciens caches
// ============================================
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating v2...");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Prend le controle immediatement
  self.clients.claim();
});

// ============================================
// Fetch - Strategie Network First avec fallback cache
// ============================================
self.addEventListener("fetch", (event) => {
  // Ignore non-GET requests
  if (event.request.method !== "GET") return;

  // Ignore les requetes externes (API, etc.)
  const url = new URL(event.request.url);
  if (!url.origin.includes(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone la reponse car elle ne peut etre lue qu'une fois
        const responseToCache = response.clone();

        // Cache les reponses reussies
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      })
      .catch(() => {
        // Si le reseau echoue, essaie le cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Si c'est une navigation et qu'il n'y a pas de cache, retourne la page offline
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }

          // Sinon retourne une reponse vide
          return new Response("Network error", {
            status: 408,
            headers: { "Content-Type": "text/plain" },
          });
        });
      })
  );
});

// ============================================
// Push Notifications
// ============================================
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received");

  let notificationData = {
    title: "Appel d'Offre Automation",
    body: "Nouvelle notification",
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: "default",
    data: {},
    requireInteraction: false,
  };

  // Parse le payload JSON si disponible
  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        ...notificationData,
        title: payload.title || notificationData.title,
        body: payload.body || payload.message || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        tag: payload.tag || payload.type || notificationData.tag,
        data: payload.data || payload,
        requireInteraction: payload.requireInteraction ||
          payload.priority === "urgent" ||
          payload.priority === "high",
      };

      // Ajouter les actions selon le type de notification
      if (payload.type === "hitl_decision_required") {
        notificationData.actions = [
          { action: "view", title: "Voir", icon: "/icons/view.svg" },
          { action: "approve", title: "Approuver", icon: "/icons/check.svg" },
          { action: "reject", title: "Rejeter", icon: "/icons/x.svg" },
        ];
        notificationData.requireInteraction = true;
        notificationData.tag = `hitl-${payload.data?.case_id || "unknown"}`;
      } else if (payload.type === "workflow_update") {
        notificationData.actions = [
          { action: "view", title: "Voir le workflow" },
        ];
        notificationData.tag = `workflow-${payload.data?.case_id || "unknown"}`;
      } else if (payload.type === "extension_sync") {
        notificationData.actions = [
          { action: "view", title: "Voir l'opportunite" },
          { action: "dismiss", title: "Ignorer" },
        ];
        notificationData.tag = `extension-${Date.now()}`;
      }
    } catch (e) {
      console.warn("[SW] Failed to parse push data:", e);
      // Utilise les donnees brutes comme body
      notificationData.body = event.data.text();
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      actions: notificationData.actions || [],
      requireInteraction: notificationData.requireInteraction,
      vibrate: [200, 100, 200],
      renotify: true,
    }
  );

  event.waitUntil(promiseChain);
});

// ============================================
// Notification Click Handler
// ============================================
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification click:", event.action, event.notification.tag);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  let targetUrl = "/";

  // Determiner l'URL cible selon le type et l'action
  if (data.type === "hitl_decision_required") {
    if (action === "view" || !action) {
      targetUrl = data.link || `/workflow/${data.case_id}/hitl/${data.checkpoint}`;
    } else if (action === "approve" || action === "reject") {
      // Pour les actions rapides, on redirige quand meme vers la page HITL
      // L'action sera traitee par l'application
      targetUrl = `/workflow/${data.case_id}/hitl/${data.checkpoint}?action=${action}`;
    }
  } else if (data.type === "workflow_update") {
    targetUrl = data.link || `/workflow/${data.case_id}`;
  } else if (data.type === "extension_sync") {
    if (action === "dismiss") {
      return; // Ne fait rien
    }
    targetUrl = data.link || "/tenders";
  } else if (data.link) {
    targetUrl = data.link;
  }

  // Ouvre ou focus la fenetre appropriee
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Cherche une fenetre deja ouverte sur le meme domaine
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          // Naviguer vers l'URL cible et focus
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      // Sinon ouvre une nouvelle fenetre
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ============================================
// Notification Close Handler
// ============================================
self.addEventListener("notificationclose", (event) => {
  const notification = event.notification;
  const data = notification.data || {};

  console.log("[SW] Notification closed:", notification.tag);

  // Envoie un evenement au client pour tracker la fermeture
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      windowClients.forEach((client) => {
        client.postMessage({
          type: "NOTIFICATION_CLOSED",
          tag: notification.tag,
          data: data,
        });
      });
    })
  );
});

// ============================================
// Push Subscription Change
// ============================================
self.addEventListener("pushsubscriptionchange", (event) => {
  console.log("[SW] Push subscription changed");

  event.waitUntil(
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          // La cle VAPID sera injectee par l'application
          self.__VAPID_PUBLIC_KEY__ || ""
        ),
      })
      .then((subscription) => {
        // Notifie le serveur de la nouvelle subscription
        return fetch("/api/v1/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
        });
      })
      .catch((error) => {
        console.error("[SW] Failed to resubscribe:", error);
      })
  );
});

// ============================================
// Messages - Communication avec l'app
// ============================================
self.addEventListener("message", (event) => {
  const { type, data } = event.data || {};

  switch (type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;

    case "CACHE_URLS":
      if (data?.urls) {
        event.waitUntil(
          caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(data.urls);
          })
        );
      }
      break;

    case "SET_VAPID_KEY":
      self.__VAPID_PUBLIC_KEY__ = data?.key;
      break;

    case "GET_SUBSCRIPTION":
      event.waitUntil(
        self.registration.pushManager.getSubscription().then((subscription) => {
          event.source.postMessage({
            type: "SUBSCRIPTION_RESULT",
            subscription: subscription ? subscription.toJSON() : null,
          });
        })
      );
      break;

    case "SHOW_LOCAL_NOTIFICATION":
      // Permet a l'app d'afficher des notifications meme sans push
      if (data) {
        self.registration.showNotification(data.title || "Notification", {
          body: data.body || data.message,
          icon: data.icon || "/icon.svg",
          badge: data.badge || "/icon.svg",
          tag: data.tag || `local-${Date.now()}`,
          data: data.data || data,
          actions: data.actions || [],
          requireInteraction: data.requireInteraction || false,
          vibrate: data.vibrate || [200, 100, 200],
        });
      }
      break;

    default:
      console.log("[SW] Unknown message type:", type);
  }
});

// ============================================
// Background Sync
// ============================================
self.addEventListener("sync", (event) => {
  console.log("[SW] Sync event:", event.tag);

  if (event.tag === "sync-notifications") {
    event.waitUntil(syncNotifications());
  } else if (event.tag === "sync-hitl-actions") {
    event.waitUntil(syncHITLActions());
  }
});

async function syncNotifications() {
  try {
    // Recupere les notifications en attente depuis IndexedDB ou localStorage
    const pendingNotifications = await getPendingNotifications();

    for (const notification of pendingNotifications) {
      await self.registration.showNotification(notification.title, notification);
    }

    await clearPendingNotifications();
  } catch (error) {
    console.error("[SW] Failed to sync notifications:", error);
  }
}

async function syncHITLActions() {
  try {
    // Recupere les actions HITL en attente
    const pendingActions = await getPendingHITLActions();

    for (const action of pendingActions) {
      const response = await fetch(`/api/v1/hitl/${action.case_id}/${action.checkpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action.decision),
      });

      if (response.ok) {
        await removePendingHITLAction(action.id);
      }
    }
  } catch (error) {
    console.error("[SW] Failed to sync HITL actions:", error);
  }
}

// ============================================
// IndexedDB Helpers pour Background Sync
// ============================================
const DB_NAME = "ao-notifications-db";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains("pending-notifications")) {
        db.createObjectStore("pending-notifications", { keyPath: "id", autoIncrement: true });
      }

      if (!db.objectStoreNames.contains("pending-hitl-actions")) {
        db.createObjectStore("pending-hitl-actions", { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

async function getPendingNotifications() {
  try {
    const db = await openDB();
    const tx = db.transaction("pending-notifications", "readonly");
    const store = tx.objectStore("pending-notifications");
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

async function clearPendingNotifications() {
  try {
    const db = await openDB();
    const tx = db.transaction("pending-notifications", "readwrite");
    const store = tx.objectStore("pending-notifications");
    store.clear();
  } catch {
    // Ignore
  }
}

async function getPendingHITLActions() {
  try {
    const db = await openDB();
    const tx = db.transaction("pending-hitl-actions", "readonly");
    const store = tx.objectStore("pending-hitl-actions");
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

async function removePendingHITLAction(id) {
  try {
    const db = await openDB();
    const tx = db.transaction("pending-hitl-actions", "readwrite");
    const store = tx.objectStore("pending-hitl-actions");
    store.delete(id);
  } catch {
    // Ignore
  }
}

// ============================================
// Utility Functions
// ============================================
function urlBase64ToUint8Array(base64String) {
  if (!base64String) return new Uint8Array();

  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

console.log("[SW] Service Worker v2 loaded with push notification support");
