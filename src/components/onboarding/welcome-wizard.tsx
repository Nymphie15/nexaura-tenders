"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Rocket,
  FileUp,
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Upload,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useOnboarding } from "@/hooks/use-onboarding";

interface WelcomeWizardProps {
  open: boolean;
  onComplete: () => void;
}

const TOTAL_STEPS = 3;

const features = [
  {
    icon: FileUp,
    title: "Importez votre DCE",
    description:
      "Chargez vos documents de consultation et laissez l'IA les analyser automatiquement.",
  },
  {
    icon: Building2,
    title: "Configurez votre profil",
    description:
      "Renseignez les informations de votre entreprise pour des réponses personnalisées.",
  },
  {
    icon: CheckCircle2,
    title: "Suivez et validez",
    description:
      "Pilotez chaque étape de votre réponse et validez avant soumission.",
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

export function WelcomeWizard({ open, onComplete }: WelcomeWizardProps) {
  const router = useRouter();
  const { completeTour } = useOnboarding();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [siret, setSiret] = useState("");

  const progressValue = ((step + 1) / TOTAL_STEPS) * 100;

  function goNext() {
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }

  function goBack() {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }

  function handleComplete() {
    completeTour();
    onComplete();
  }

  function handleGoToProfile() {
    handleComplete();
    router.push("/settings/company");
  }

  function handleImportDCE() {
    handleComplete();
    router.push("/tenders");
  }

  function handleDemo() {
    handleComplete();
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-xl overflow-hidden"
        showCloseButton={false}
      >
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Étape {step + 1} sur {TOTAL_STEPS}
            </span>
            <span>{Math.round(progressValue)}%</span>
          </div>
          <Progress value={progressValue} />
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          {/* Step 0: Bienvenue */}
          {step === 0 && (
            <motion.div
              key="step-0"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <DialogHeader className="items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.1,
                  }}
                  className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
                >
                  <Rocket className="h-8 w-8 text-primary" />
                </motion.div>
                <DialogTitle className="text-2xl">
                  Bienvenue sur NexAura
                </DialogTitle>
                <DialogDescription className="text-base">
                  Votre assistant intelligent pour répondre aux appels d'offres
                  publics en toute simplicité.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 grid gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-start gap-4 rounded-xl bg-primary/10 p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{feature.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <DialogFooter className="mt-6">
                <Button onClick={goNext} className="w-full" size="lg">
                  Commencer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* Step 1: Profil entreprise */}
          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <DialogHeader className="items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.1,
                  }}
                  className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
                >
                  <Building2 className="h-8 w-8 text-primary" />
                </motion.div>
                <DialogTitle className="text-2xl">
                  Profil entreprise
                </DialogTitle>
                <DialogDescription className="text-base">
                  Renseignez votre SIRET pour pré-remplir les informations de
                  votre entreprise.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siret">Numéro SIRET</Label>
                  <div className="flex gap-2">
                    <Input
                      id="siret"
                      placeholder="123 456 789 00012"
                      value={siret}
                      onChange={(e) => setSiret(e.target.value)}
                      maxLength={17}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    14 chiffres identifiant votre établissement.
                  </p>
                </div>

                <div className="rounded-xl bg-primary/10 p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium">
                        Remplissage automatique indisponible
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Rendez-vous sur la page profil pour saisir manuellement
                        les informations de votre entreprise.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGoToProfile}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Aller au profil entreprise
                </Button>
              </div>

              <DialogFooter className="mt-6 flex-row justify-between gap-2">
                <Button variant="ghost" onClick={goBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
                <Button onClick={goNext}>
                  Continuer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* Step 2: Premier appel d'offres */}
          {step === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <DialogHeader className="items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.1,
                  }}
                  className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
                >
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </motion.div>
                <DialogTitle className="text-2xl">
                  Votre premier appel d'offres
                </DialogTitle>
                <DialogDescription className="text-base">
                  Vous êtes prêt ! Importez un DCE pour commencer ou explorez
                  la plateforme avec une démo.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 grid gap-4">
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  onClick={handleImportDCE}
                  className="flex items-center gap-4 rounded-xl bg-primary/10 p-4 text-left transition-colors hover:bg-primary/20"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium">Importer un DCE</p>
                    <p className="text-sm text-muted-foreground">
                      Chargez vos documents et laissez l'IA préparer votre
                      réponse.
                    </p>
                  </div>
                  <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground" />
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  onClick={handleDemo}
                  className="flex items-center gap-4 rounded-xl border p-4 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Voir la démo</p>
                    <p className="text-sm text-muted-foreground">
                      Découvrez les fonctionnalités avec un exemple guidé.
                    </p>
                  </div>
                  <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground" />
                </motion.button>
              </div>

              <DialogFooter className="mt-6 flex-row justify-between gap-2">
                <Button variant="ghost" onClick={goBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
