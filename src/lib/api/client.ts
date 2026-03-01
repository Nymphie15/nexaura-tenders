import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import axiosRetry from "axios-retry";
import { toast } from "sonner";

// Ensure base URL includes /api/v2 prefix (Phase 2 domain consolidation)
const _rawBase = process.env.NEXT_PUBLIC_API_URL || "";
const API_BASE_URL = _rawBase.endsWith("/api/v2")
  ? _rawBase
  : `${_rawBase}/api/v2`;

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Configure automatic retry
axiosRetry(api, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: AxiosError) => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 503 ||
      error.response?.status === 502 ||
      error.code === "ECONNABORTED"
    );
  },
  onRetry: (retryCount, error) => {
    console.log(`Retry attempt ${retryCount} for:`, error.config?.url);
  },
});

// Generate UUID v4 (simple implementation)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Request interceptor - Add auth token + Trace ID
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      // Add auth token
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add Trace ID for request correlation
      let traceId = sessionStorage.getItem("trace_id");
      if (!traceId) {
        traceId = generateUUID();
        sessionStorage.setItem("trace_id", traceId);
      }
      config.headers["X-Trace-Id"] = traceId;

      // Add Request ID (unique per request)
      config.headers["X-Request-Id"] = generateUUID();

      // Add CSRF token for non-GET requests
      if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
        const csrfToken = document.cookie.split('; ').find(c => c.startsWith('csrf_token='))?.split('=')[1];
        if (csrfToken) {
          config.headers["X-CSRF-Token"] = csrfToken;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Token refresh queue to prevent race conditions
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 3;

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function clearRefreshQueue() {
  refreshSubscribers = [];
  isRefreshing = false;
  refreshAttempts = 0;
}

function forceLogout() {
  clearRefreshQueue();
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  toast.error("Session expirée", {
    description: "Trop de tentatives de reconnexion. Veuillez vous reconnecter.",
  });
  setTimeout(() => {
    window.location.href = "/login";
  }, 1000);
}

// Response interceptor - Handle token refresh + errors (UNIFIED)
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ detail?: string | Array<{ loc?: string[]; msg: string }>; message?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Log error with trace ID for debugging
    const traceId = originalRequest?.headers?.["X-Trace-Id"];
    const requestId = originalRequest?.headers?.["X-Request-Id"];
    console.error("[API Error]", {
      traceId,
      requestId,
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      message: error.response?.data?.detail || error.message,
    });

    // Handle 401 - Try to refresh token FIRST (before showing toasts)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (typeof window === "undefined") {
        return Promise.reject(error);
      }

      // If a refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      // Rate limit refresh attempts to prevent infinite loops
      refreshAttempts++;
      if (refreshAttempts > MAX_REFRESH_ATTEMPTS) {
        forceLogout();
        return Promise.reject(error);
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const response = await api.post("/auth/refresh", {
            refresh_token: refreshToken,
          });
          const { access_token } = response.data;

          localStorage.setItem("access_token", access_token);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;

          isRefreshing = false;
          refreshAttempts = 0; // Reset on success
          onTokenRefreshed(access_token);

          // Retry original request with new token
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - if max attempts reached, force logout
        if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
          forceLogout();
          return Promise.reject(refreshError);
        }
        // Clear auth and redirect
        clearRefreshQueue();
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");

        toast.error("Session expirée", {
          description: "Veuillez vous reconnecter.",
        });

        // Delay redirect to let toast show
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
        return Promise.reject(refreshError);
      }

      isRefreshing = false;
    }

    // Handle network errors
    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        toast.error("Délai d'attente dépassé", {
          description: "La requête a pris trop de temps. Veuillez réessayer.",
        });
      } else {
        toast.error("Erreur réseau", {
          description: "Impossible de contacter le serveur. Vérifiez votre connexion.",
        });
      }
      return Promise.reject(error);
    }

    const status = error.response.status;
    const data = error.response.data;

    // Handle HTTP errors (skip 401 as it was already handled above)
    switch (status) {
      case 400:
        toast.error("Requête invalide", {
          description: typeof data?.detail === "string"
            ? data.detail
            : data?.message || "Les données envoyées sont incorrectes.",
        });
        break;

      case 401:
        // Already handled above (refresh token logic)
        break;

      case 403:
        toast.error("Accès refusé", {
          description: "Vous n'avez pas les droits pour effectuer cette action.",
        });
        break;

      case 404:
        // Don't show toast for 404 - let components handle it
        console.warn("Resource not found:", originalRequest?.url);
        break;

      case 422: {
        if (data?.detail) {
          const errors = Array.isArray(data.detail)
            ? data.detail.map((err) => `${err.loc?.join(".")} : ${err.msg}`).join("\n")
            : data.detail;
          toast.error("Erreur de validation", {
            description: errors,
          });
        }
        break;
      }

      case 429: {
        const retryAfter = error.response.headers["retry-after"];
        toast.error("Trop de requêtes", {
          description: retryAfter
            ? `Veuillez patienter ${retryAfter} secondes.`
            : "Veuillez patienter avant de réessayer.",
        });
        break;
      }

      case 500:
      case 502:
      case 503:
        toast.error("Erreur serveur", {
          description: "Une erreur est survenue. Nos équipes ont été notifiées.",
        });
        break;

      default:
        toast.error(`Erreur ${status}`, {
          description: typeof data?.detail === "string"
            ? data.detail
            : "Une erreur inattendue s'est produite.",
        });
    }

    return Promise.reject(error);
  }
);

export default api;
