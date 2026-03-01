"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle } from "lucide-react";

interface DecisionTimerProps {
  deadline?: string;
  openedAt?: string;
}

export function DecisionTimer({ deadline, openedAt }: DecisionTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState<string | null>(null);

  useEffect(() => {
    const startTime = openedAt ? new Date(openedAt).getTime() : Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      setElapsed(Math.floor((now - startTime) / 1000));

      if (deadline) {
        const deadlineTime = new Date(deadline).getTime();
        const diff = deadlineTime - now;
        if (diff <= 0) {
          setRemaining("Expire");
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          if (days > 0) setRemaining(`${days}j ${hours}h`);
          else if (hours > 0) setRemaining(`${hours}h ${mins}m`);
          else setRemaining(`${mins}m`);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline, openedAt]);

  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isUrgent = remaining === "Expire" || (deadline && new Date(deadline).getTime() - Date.now() < 24 * 60 * 60 * 1000);

  return (
    <Card className={isUrgent ? "border-red-500/50" : ""}>
      <CardContent className="flex items-center justify-between py-3 px-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Temps de decision</p>
            <p className="text-sm font-mono font-medium">{formatElapsed(elapsed)}</p>
          </div>
        </div>
        {remaining && (
          <div className="flex items-center gap-2">
            {isUrgent && <AlertTriangle className="h-4 w-4 text-red-500" />}
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Deadline</p>
              <p className={`text-sm font-medium ${isUrgent ? "text-red-500" : ""}`}>{remaining}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
