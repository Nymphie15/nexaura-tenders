import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api/client";
import type { CompanyProfile } from "@/types";

export const companyKeys = {
  all: ["company"] as const,
  profile: () => [...companyKeys.all, "profile"] as const,
};

export function useCompanyProfile() {
  return useQuery({
    queryKey: companyKeys.profile(),
    queryFn: async () => {
      const response = await api.get<CompanyProfile>("/company/me");
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    retryDelay: 500,
  });
}

export function useUpdateCompanyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<CompanyProfile>) => {
      const currentProfile = queryClient.getQueryData<CompanyProfile>(companyKeys.profile());
      if (!currentProfile?.siret) {
        throw new Error("No company profile found or SIRET missing");
      }

      // Map frontend field names to backend field names
      const phone = (data.phone || data.contact_phone || "").replace(/\s+/g, "");
      const certsRaw = data.certifications;
      const certs = Array.isArray(certsRaw)
        ? certsRaw
        : typeof certsRaw === "string"
          ? (certsRaw as string).split("\n").map((s: string) => s.trim()).filter(Boolean)
          : [];

      const sectorMap: Record<string, string> = {
        "btp": "BTP",
        "fournitures": "FOURNITURES",
        "services": "SERVICES",
        "informatique": "IT",
        "energie": "ENERGIE",
        "transport": "TRANSPORT",
        "sante": "MEDICAL",
        "securite": "SECURITE",
        "restauration": "RESTAURATION",
        "formation": "FORMATION",
      };
      const sector = data.sector ? (sectorMap[data.sector] || data.sector.toUpperCase()) : undefined;

      const backendData: Record<string, unknown> = {
        siret: data.siret || currentProfile.siret,
        raison_sociale: data.name || currentProfile.name || "",
        forme_juridique: data.legal_form || undefined,
        adresse: data.address || undefined,
        code_postal: data.postal_code || undefined,
        ville: data.city || undefined,
        telephone: phone || undefined,
        email: data.email || data.contact_email || undefined,
        site_web: data.website || undefined,
        activite_principale: data.description || undefined,
        effectif: data.employees || undefined,
        chiffre_affaires: data.annual_revenue || undefined,
        certifications: certs,
        domaines_competence: sector ? [sector] : [],
      };

      // Remove undefined values
      Object.keys(backendData).forEach(key => {
        if (backendData[key] === undefined) delete backendData[key];
      });

      const response = await api.put<CompanyProfile>(
        `/company/${currentProfile.siret}`,
        backendData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.profile() });
    },
  });
}

export function useUploadLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const currentProfile = queryClient.getQueryData<CompanyProfile>(companyKeys.profile());
      if (!currentProfile?.siret) {
        throw new Error("No company profile found or SIRET missing");
      }

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const base64 = await base64Promise;

      const response = await api.put<CompanyProfile>(
        `/company/${currentProfile.siret}`,
        { logo_url: base64 }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.profile() });
    },
  });
}
