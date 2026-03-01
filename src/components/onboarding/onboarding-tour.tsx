"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
// CallBackProps defined locally since react-joyride is not installed (stubbed for React 19)
interface CallBackProps {
  action: string;
  controlled: boolean;
  index: number;
  lifecycle: string;
  size: number;
  status: string;
  step: unknown;
  type: string;
}

// Constantes react-joyride (definies localement pour eviter les problemes de bundling avec dynamic import)
const STATUS = {
  FINISHED: "finished",
  IDLE: "idle",
  PAUSED: "paused",
  RUNNING: "running",
  SKIPPED: "skipped",
  WAITING: "waiting",
} as const;

const EVENTS = {
  BEACON: "beacon",
  ERROR: "error",
  STEP_AFTER: "step:after",
  STEP_BEFORE: "step:before",
  TARGET_NOT_FOUND: "error:target_not_found",
  TOOLTIP: "tooltip",
  TOUR_END: "tour:end",
  TOUR_START: "tour:start",
  TOUR_STATUS: "tour:status",
} as const;

const ACTIONS = {
  CLOSE: "close",
  INIT: "init",
  NEXT: "next",
  PREV: "prev",
  RESET: "reset",
  RESTART: "restart",
  SKIP: "skip",
  START: "start",
  STOP: "stop",
  UPDATE: "update",
} as const;
import {
  TOUR_STEPS,
  TOUR_CONFIG,
  ACHIEVEMENT_BADGES,
  getStepById,
  getBadgeForStep,
} from "./tour-steps";
import { useOnboarding, useBadgeCelebration } from "@/hooks/use-onboarding";
import {
  BadgeCelebration,
  BadgeNotification,
  BadgeIndicator,
} from "./achievement-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Rocket, SkipForward, PlayCircle } from "lucide-react";

// Joyride stub - react-joyride incompatible with React 19 (unmountComponentAtNode removed)
// TODO (post-MVP): Replace with React 19 compatible tour library
const Joyride = dynamic(
  () => Promise.resolve(({ ...props }: Record<string, unknown>) => null),
  { ssr: false }
);

// Welcome dialog component
interface WelcomeDialogProps {
  open: boolean;
  onStart: () => void;
  onSkip: () => void;
}

function WelcomeDialog({ open, onStart, onSkip }: WelcomeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 mb-4">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Bienvenue sur Nexaura Tenders !
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            Decouvrez comment automatiser vos reponses aux appels d&apos;offres
            en quelques minutes.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 text-sm font-bold text-primary">
                1
              </div>
              <div>
                <p className="font-medium">Importez votre DCE</p>
                <p className="text-sm text-muted-foreground">
                  Deposez vos documents pour une analyse automatique
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 text-sm font-bold text-primary">
                2
              </div>
              <div>
                <p className="font-medium">Configurez votre profil</p>
                <p className="text-sm text-muted-foreground">
                  Personnalisez les reponses selon votre entreprise
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 text-sm font-bold text-primary">
                3
              </div>
              <div>
                <p className="font-medium">Suivez et validez</p>
                <p className="text-sm text-muted-foreground">
                  Gardez le controle a chaque etape importante
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-slate-100 dark:bg-slate-800 p-4">
            <p className="text-sm text-center text-muted-foreground">
              <span className="font-medium text-foreground">5 badges</span> a
              debloquer pour maitriser Nexaura !
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onSkip} className="gap-2">
            <SkipForward className="h-4 w-4" />
            Passer le tour
          </Button>
          <Button onClick={onStart} className="gap-2">
            <PlayCircle className="h-4 w-4" />
            Commencer le tour guide
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Resume dialog for returning users who haven't completed
interface ResumeDialogProps {
  open: boolean;
  progress: number;
  earnedBadges: number;
  onResume: () => void;
  onRestart: () => void;
  onSkip: () => void;
}

function ResumeDialog({
  open,
  progress,
  earnedBadges,
  onResume,
  onRestart,
  onSkip,
}: ResumeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Reprendre le tour ?
          </DialogTitle>
          <DialogDescription className="text-center">
            Vous avez deja commence l&apos;onboarding
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {earnedBadges} / 5 badges obtenus
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="ghost" onClick={onSkip} size="sm">
            Terminer plus tard
          </Button>
          <Button variant="outline" onClick={onRestart} size="sm">
            Recommencer
          </Button>
          <Button onClick={onResume} size="sm">
            Reprendre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main onboarding tour component
export function OnboardingTour() {
  const {
    state,
    isLoading,
    isTourActive,
    shouldShowTour,
    currentStepIndex,
    earnedBadges,
    progress,
    startTour,
    completeStep,
    completeTour,
    skipTour,
    resetTour,
    setStepIndex,
  } = useOnboarding();

  const { celebratingBadge, celebrate, dismissCelebration } =
    useBadgeCelebration();

  const [showWelcome, setShowWelcome] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [run, setRun] = useState(false);
  const [stepIndex, setLocalStepIndex] = useState(0);
  const [notificationBadge, setNotificationBadge] = useState<typeof celebratingBadge>(null);

  // Check if we should show dialogs on mount
  useEffect(() => {
    if (isLoading) return;

    if (shouldShowTour) {
      setShowWelcome(true);
    } else if (state.status === "in_progress" && currentStepIndex < TOUR_STEPS.length) {
      // User started but didn't finish - offer to resume
      setShowResume(true);
    }
  }, [isLoading, shouldShowTour, state.status, currentStepIndex]);

  // Sync step index with state
  useEffect(() => {
    setLocalStepIndex(currentStepIndex);
  }, [currentStepIndex]);

  // Start tour handler
  const handleStartTour = useCallback(() => {
    setShowWelcome(false);
    startTour();
    setRun(true);
  }, [startTour]);

  // Skip tour handler
  const handleSkipTour = useCallback(() => {
    setShowWelcome(false);
    setShowResume(false);
    skipTour();
  }, [skipTour]);

  // Resume tour handler
  const handleResumeTour = useCallback(() => {
    setShowResume(false);
    setRun(true);
  }, []);

  // Restart tour handler
  const handleRestartTour = useCallback(() => {
    setShowResume(false);
    resetTour();
    setTimeout(() => {
      startTour();
      setRun(true);
    }, 100);
  }, [resetTour, startTour]);

  // Joyride callback
  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, action, index, type } = data;

      // Handle step change
      if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
        const currentStep = TOUR_STEPS[index];
        if (currentStep) {
          const badge = completeStep(currentStep.id);
          if (badge) {
            setNotificationBadge(badge);
          }
        }
        setLocalStepIndex(index + 1);
        setStepIndex(index + 1);
      }

      if (type === EVENTS.STEP_AFTER && action === ACTIONS.PREV) {
        setLocalStepIndex(index - 1);
        setStepIndex(index - 1);
      }

      // Handle tour completion
      if (status === STATUS.FINISHED) {
        // Complete last step
        const lastStep = TOUR_STEPS[TOUR_STEPS.length - 1];
        if (lastStep && !earnedBadges.find((b) => b.stepId === lastStep.id)) {
          const badge = completeStep(lastStep.id);
          if (badge) {
            celebrate(badge);
          }
        }
        completeTour();
        setRun(false);
      }

      // Handle skip
      if (status === STATUS.SKIPPED) {
        skipTour();
        setRun(false);
      }

      // Handle close
      if (action === ACTIONS.CLOSE) {
        setRun(false);
      }
    },
    [completeStep, completeTour, skipTour, setStepIndex, earnedBadges, celebrate]
  );

  // Don't render until loaded
  if (isLoading) return null;

  return (
    <>
      {/* Welcome dialog for new users */}
      <WelcomeDialog
        open={showWelcome}
        onStart={handleStartTour}
        onSkip={handleSkipTour}
      />

      {/* Resume dialog for returning users */}
      <ResumeDialog
        open={showResume}
        progress={progress}
        earnedBadges={earnedBadges.length}
        onResume={handleResumeTour}
        onRestart={handleRestartTour}
        onSkip={handleSkipTour}
      />

      {/* Joyride tour */}
      <Joyride
        steps={TOUR_STEPS}
        run={run}
        stepIndex={stepIndex}
        callback={handleJoyrideCallback}
        continuous={TOUR_CONFIG.continuous}
        showSkipButton={TOUR_CONFIG.showSkipButton}
        showProgress={TOUR_CONFIG.showProgress}
        scrollToFirstStep={TOUR_CONFIG.scrollToFirstStep}
        scrollOffset={TOUR_CONFIG.scrollOffset}
        spotlightPadding={TOUR_CONFIG.spotlightPadding}
        disableOverlayClose={TOUR_CONFIG.disableOverlayClose}
        hideCloseButton={TOUR_CONFIG.hideCloseButton}
        locale={TOUR_CONFIG.locale}
        styles={TOUR_CONFIG.styles}
        floaterProps={{
          disableAnimation: false,
        }}
      />

      {/* Badge celebration modal */}
      <BadgeCelebration
        badge={celebratingBadge}
        open={!!celebratingBadge}
        onClose={dismissCelebration}
        totalBadges={ACHIEVEMENT_BADGES.length}
        earnedCount={earnedBadges.length}
      />

      {/* Badge notification toast */}
      {notificationBadge && (
        <BadgeNotification
          badge={notificationBadge!}
          show={!!notificationBadge}
          onDismiss={() => setNotificationBadge(null)}
        />
      )}
    </>
  );
}

// Export a provider component to wrap the app
export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <OnboardingTour />
    </>
  );
}

// Export badge indicator for use in header/sidebar
export { BadgeIndicator };

// Export hook to manually trigger tour
export function useTourTrigger() {
  const { startTour, resetTour, isTourActive, isTourCompleted } = useOnboarding();

  const restartTour = useCallback(() => {
    resetTour();
    setTimeout(() => {
      startTour();
    }, 100);
  }, [resetTour, startTour]);

  return {
    startTour,
    restartTour,
    isTourActive,
    isTourCompleted,
  };
}
