import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { CommandPalette } from "@/components/command-palette";
import { OfflineIndicator } from "@/components/offline-indicator";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Nexaura Tenders | Automatisation Appels d'Offres",
    template: "%s | Nexaura Tenders",
  },
  description:
    "Plateforme d'automatisation des réponses aux appels d'offres publics français. Gagnez du temps, augmentez votre taux de réussite.",
  keywords: [
    "appels d'offres",
    "marchés publics",
    "BOAMP",
    "automatisation",
    "réponse AO",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <Providers>
          <ServiceWorkerRegister />
          <OfflineIndicator />
          <CommandPalette />
          {children}
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
