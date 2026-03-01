"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AchievementBadge as BadgeType } from "./tour-steps";
import {
  Upload,
  Building2,
  GitBranch,
  CheckCircle2,
  Package,
  Star,
  Trophy,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// Map icon names to Lucide components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  upload: Upload,
  building: Building2,
  "git-branch": GitBranch,
  "check-circle": CheckCircle2,
  package: Package,
  star: Star,
  trophy: Trophy,
};

interface AchievementBadgeProps {
  badge: BadgeType;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  earned?: boolean;
  className?: string;
  onClick?: () => void;
}

export function AchievementBadge({
  badge,
  size = "md",
  showLabel = false,
  earned = false,
  className,
  onClick,
}: AchievementBadgeProps) {
  const Icon = iconMap[badge.icon] || Star;

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full transition-all duration-300",
          sizeClasses[size],
          earned
            ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30"
            : "bg-muted/50 border-2 border-dashed border-muted-foreground/30"
        )}
      >
        <Icon
          className={cn(
            iconSizes[size],
            earned ? "text-white" : "text-muted-foreground/50"
          )}
        />
        {earned && (
          <div className="absolute -bottom-1 -right-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 bg-card rounded-full" />
          </div>
        )}
      </div>
      {showLabel && (
        <div className="text-center">
          <p
            className={cn(
              "text-xs font-medium",
              earned ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {badge.title}
          </p>
        </div>
      )}
    </div>
  );
}

// Badge collection display
interface BadgeCollectionProps {
  earnedBadges: BadgeType[];
  allBadges: BadgeType[];
  className?: string;
}

export function BadgeCollection({
  earnedBadges,
  allBadges,
  className,
}: BadgeCollectionProps) {
  const earnedIds = new Set(earnedBadges.map((b) => b.id));
  const progress = Math.round((earnedBadges.length / allBadges.length) * 100);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Vos badges</h3>
          <p className="text-sm text-muted-foreground">
            {earnedBadges.length} / {allBadges.length} obtenus
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <span className="font-bold text-amber-600">{progress}%</span>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="grid grid-cols-5 gap-4">
        {allBadges.map((badge) => (
          <AchievementBadge
            key={badge.id}
            badge={badge}
            size="md"
            showLabel
            earned={earnedIds.has(badge.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Celebration modal when earning a badge
interface BadgeCelebrationProps {
  badge: BadgeType | null;
  open: boolean;
  onClose: () => void;
  totalBadges: number;
  earnedCount: number;
}

export function BadgeCelebration({
  badge,
  open,
  onClose,
  totalBadges,
  earnedCount,
}: BadgeCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!badge) return null;

  const Icon = iconMap[badge.icon] || Star;
  const isComplete = earnedCount === totalBadges;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md text-center">
        {/* Confetti animation */}
        {showConfetti && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <Sparkles
                key={i}
                className={cn(
                  "absolute text-amber-400 animate-bounce",
                  i % 2 === 0 ? "animate-pulse" : ""
                )}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
        )}

        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {isComplete ? "Felicitations !" : "Nouveau badge !"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isComplete
              ? "Vous avez complete l'onboarding !"
              : "Vous avez debloque un nouveau badge"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          {/* Badge display with animation */}
          <div className="relative animate-bounce-slow">
            <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl animate-pulse" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-xl shadow-amber-500/40">
              <Icon className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>

          {/* Badge info */}
          <h3 className="mt-6 text-lg font-bold">{badge.title}</h3>
          <p className="mt-2 text-muted-foreground">{badge.description}</p>

          {/* Progress */}
          <div className="mt-6 w-full max-w-xs">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">
                {earnedCount} / {totalBadges}
              </span>
            </div>
            <Progress
              value={(earnedCount / totalBadges) * 100}
              className="h-2"
            />
          </div>
        </div>

        <Button onClick={onClose} className="w-full">
          {isComplete ? "Commencer a utiliser Nexaura" : "Continuer"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// Mini badge indicator for header/sidebar
interface BadgeIndicatorProps {
  earnedCount: number;
  totalCount: number;
  onClick?: () => void;
  className?: string;
}

export function BadgeIndicator({
  earnedCount,
  totalCount,
  onClick,
  className,
}: BadgeIndicatorProps) {
  const progress = Math.round((earnedCount / totalCount) * 100);

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1.5 transition-colors hover:bg-amber-500/20",
        className
      )}
    >
      <Trophy className="h-4 w-4 text-amber-600" />
      <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
        {earnedCount}/{totalCount}
      </span>
      {progress === 100 && (
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      )}
    </button>
  );
}

// Floating badge notification
interface BadgeNotificationProps {
  badge: BadgeType;
  show: boolean;
  onDismiss: () => void;
}

export function BadgeNotification({
  badge,
  show,
  onDismiss,
}: BadgeNotificationProps) {
  const Icon = iconMap[badge.icon] || Star;

  useEffect(() => {
    if (show) {
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 animate-slide-up",
        "flex items-center gap-3 rounded-xl bg-background border shadow-lg p-4",
        "max-w-sm"
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600">
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold">Badge debloque !</p>
        <p className="text-xs text-muted-foreground">{badge.title}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-muted-foreground hover:text-foreground"
      >
        <span className="sr-only">Fermer</span>
        &times;
      </button>
    </div>
  );
}
