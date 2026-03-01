import { cn } from "@/lib/utils";

function NoTenders({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full", className)}
    >
      {/* Folder body */}
      <rect
        x="30"
        y="70"
        width="120"
        height="90"
        rx="6"
        className="text-muted-foreground/30"
        fill="currentColor"
      />
      {/* Folder tab */}
      <path
        d="M30 76C30 72.6863 32.6863 70 36 70H75L85 55H36C32.6863 55 30 57.6863 30 61V76Z"
        className="text-muted-foreground/30"
        fill="currentColor"
      />
      {/* Folder front face */}
      <rect
        x="30"
        y="80"
        width="120"
        height="80"
        rx="4"
        className="text-muted-foreground/30"
        fill="currentColor"
        opacity="0.6"
      />
      {/* Magnifying glass circle */}
      <circle
        cx="130"
        cy="75"
        r="30"
        className="text-primary/60"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      {/* Magnifying glass handle */}
      <line
        x1="152"
        y1="97"
        x2="170"
        y2="115"
        className="text-primary/60"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Small lines inside glass (search detail) */}
      <line
        x1="118"
        y1="68"
        x2="142"
        y2="68"
        className="text-primary/60"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
      <line
        x1="118"
        y1="76"
        x2="136"
        y2="76"
        className="text-primary/60"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
      <line
        x1="118"
        y1="84"
        x2="139"
        y2="84"
        className="text-primary/60"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

function NoWorkflows({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full", className)}
    >
      {/* Top node */}
      <rect
        x="75"
        y="20"
        width="50"
        height="30"
        rx="6"
        className="text-muted-foreground/30"
        fill="currentColor"
      />
      {/* Dashed line from top to left middle */}
      <line
        x1="90"
        y1="50"
        x2="55"
        y2="85"
        className="text-muted-foreground/30"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="6 4"
      />
      {/* Dashed line from top to right middle */}
      <line
        x1="110"
        y1="50"
        x2="145"
        y2="85"
        className="text-muted-foreground/30"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="6 4"
      />
      {/* Left middle node */}
      <rect
        x="30"
        y="85"
        width="50"
        height="30"
        rx="6"
        className="text-muted-foreground/30"
        fill="currentColor"
      />
      {/* Right middle node */}
      <rect
        x="120"
        y="85"
        width="50"
        height="30"
        rx="6"
        className="text-muted-foreground/30"
        fill="currentColor"
      />
      {/* Dashed line from left middle to bottom */}
      <line
        x1="55"
        y1="115"
        x2="80"
        y2="150"
        className="text-muted-foreground/30"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="6 4"
      />
      {/* Dashed line from right middle to bottom */}
      <line
        x1="145"
        y1="115"
        x2="120"
        y2="150"
        className="text-muted-foreground/30"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="6 4"
      />
      {/* Bottom node */}
      <rect
        x="75"
        y="150"
        width="50"
        height="30"
        rx="6"
        className="text-muted-foreground/30"
        fill="currentColor"
      />
      {/* Accent: small diamond inside top node */}
      <rect
        x="94"
        y="28"
        width="12"
        height="12"
        rx="2"
        className="text-primary/60"
        fill="currentColor"
        transform="rotate(45 100 34)"
      />
      {/* Accent: small circles at connection points */}
      <circle cx="55" cy="85" r="3" className="text-primary/60" fill="currentColor" />
      <circle cx="145" cy="85" r="3" className="text-primary/60" fill="currentColor" />
      <circle cx="100" cy="150" r="3" className="text-primary/60" fill="currentColor" />
    </svg>
  );
}

function NoDocuments({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full", className)}
    >
      {/* Document shadow */}
      <rect
        x="58"
        y="28"
        width="100"
        height="140"
        rx="6"
        className="text-muted-foreground/30"
        fill="currentColor"
        opacity="0.3"
      />
      {/* Main document */}
      <rect
        x="50"
        y="22"
        width="100"
        height="140"
        rx="6"
        className="text-muted-foreground/30"
        fill="currentColor"
      />
      {/* Dog-ear fold */}
      <path
        d="M120 22H144C147.314 22 150 24.6863 150 28V52L120 22Z"
        className="text-muted-foreground/30"
        fill="currentColor"
        opacity="0.5"
      />
      {/* Horizontal lines representing text */}
      <line
        x1="70"
        y1="75"
        x2="130"
        y2="75"
        className="text-muted-foreground/30"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
      <line
        x1="70"
        y1="88"
        x2="120"
        y2="88"
        className="text-muted-foreground/30"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
      <line
        x1="70"
        y1="101"
        x2="125"
        y2="101"
        className="text-muted-foreground/30"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* Plus circle */}
      <circle
        cx="135"
        cy="140"
        r="25"
        className="text-primary/60"
        fill="currentColor"
        opacity="0.15"
      />
      <circle
        cx="135"
        cy="140"
        r="25"
        className="text-primary/60"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Plus sign */}
      <line
        x1="135"
        y1="128"
        x2="135"
        y2="152"
        className="text-primary/60"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="123"
        y1="140"
        x2="147"
        y2="140"
        className="text-primary/60"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NoDecisions({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full", className)}
    >
      {/* Scale base */}
      <rect
        x="90"
        y="160"
        width="20"
        height="8"
        rx="2"
        className="text-muted-foreground/30"
        fill="currentColor"
      />
      {/* Scale pillar */}
      <rect
        x="97"
        y="65"
        width="6"
        height="95"
        rx="2"
        className="text-muted-foreground/30"
        fill="currentColor"
      />
      {/* Scale beam */}
      <rect
        x="35"
        y="62"
        width="130"
        height="5"
        rx="2"
        className="text-primary/60"
        fill="currentColor"
      />
      {/* Pivot point */}
      <circle
        cx="100"
        cy="60"
        r="8"
        className="text-primary/60"
        fill="currentColor"
      />
      <circle
        cx="100"
        cy="60"
        r="4"
        className="text-muted-foreground/30"
        fill="currentColor"
      />
      {/* Left chain */}
      <line
        x1="50"
        y1="67"
        x2="50"
        y2="100"
        className="text-muted-foreground/30"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="35"
        y1="100"
        x2="50"
        y2="67"
        className="text-muted-foreground/30"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="65"
        y1="100"
        x2="50"
        y2="67"
        className="text-muted-foreground/30"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Left pan */}
      <path
        d="M30 100 Q50 115 70 100"
        className="text-muted-foreground/30"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Right chain */}
      <line
        x1="150"
        y1="67"
        x2="150"
        y2="100"
        className="text-muted-foreground/30"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="135"
        y1="100"
        x2="150"
        y2="67"
        className="text-muted-foreground/30"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="165"
        y1="100"
        x2="150"
        y2="67"
        className="text-muted-foreground/30"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Right pan */}
      <path
        d="M130 100 Q150 115 170 100"
        className="text-muted-foreground/30"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Checkmark on left pan */}
      <path
        d="M42 108 L48 114 L58 104"
        className="text-primary/60"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
      {/* Checkmark on right pan */}
      <path
        d="M142 108 L148 114 L158 104"
        className="text-primary/60"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
  );
}

function NoResults({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full", className)}
    >
      {/* Background circle for context */}
      <circle
        cx="90"
        cy="85"
        r="55"
        className="text-muted-foreground/30"
        fill="currentColor"
        opacity="0.15"
      />
      {/* Magnifying glass circle */}
      <circle
        cx="90"
        cy="85"
        r="45"
        className="text-muted-foreground/30"
        stroke="currentColor"
        strokeWidth="6"
        fill="none"
      />
      {/* Glass shine */}
      <path
        d="M65 65 Q70 58 80 60"
        className="text-muted-foreground/30"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* Handle */}
      <line
        x1="124"
        y1="119"
        x2="160"
        y2="155"
        className="text-muted-foreground/30"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
      />
      {/* X mark inside glass */}
      <line
        x1="75"
        y1="70"
        x2="105"
        y2="100"
        className="text-primary/60"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="105"
        y1="70"
        x2="75"
        y2="100"
        className="text-primary/60"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FirstTime({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full", className)}
    >
      {/* Exhaust cloud left */}
      <circle
        cx="75"
        cy="175"
        r="10"
        className="text-muted-foreground/30"
        fill="currentColor"
        opacity="0.3"
      />
      <circle
        cx="90"
        cy="182"
        r="7"
        className="text-muted-foreground/30"
        fill="currentColor"
        opacity="0.2"
      />
      {/* Exhaust cloud right */}
      <circle
        cx="115"
        cy="178"
        r="8"
        className="text-muted-foreground/30"
        fill="currentColor"
        opacity="0.25"
      />
      {/* Exhaust flames */}
      <path
        d="M88 155 L95 175 L100 160 L105 175 L112 155"
        className="text-primary/60"
        fill="currentColor"
        opacity="0.4"
      />
      {/* Rocket body */}
      <path
        d="M86 155 L100 30 L114 155 Z"
        className="text-muted-foreground/30"
        fill="currentColor"
      />
      {/* Rocket nose cone */}
      <path
        d="M92 70 L100 30 L108 70 Z"
        className="text-primary/60"
        fill="currentColor"
      />
      {/* Window */}
      <circle
        cx="100"
        cy="100"
        r="10"
        className="text-primary/60"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      <circle
        cx="100"
        cy="100"
        r="6"
        className="text-primary/60"
        fill="currentColor"
        opacity="0.2"
      />
      {/* Left fin */}
      <path
        d="M86 140 L68 165 L86 155 Z"
        className="text-muted-foreground/30"
        fill="currentColor"
        opacity="0.7"
      />
      {/* Right fin */}
      <path
        d="M114 140 L132 165 L114 155 Z"
        className="text-muted-foreground/30"
        fill="currentColor"
        opacity="0.7"
      />
      {/* Star accents */}
      <circle cx="45" cy="50" r="2.5" className="text-primary/60" fill="currentColor" opacity="0.6" />
      <circle cx="155" cy="70" r="2" className="text-primary/60" fill="currentColor" opacity="0.5" />
      <circle cx="35" cy="100" r="1.5" className="text-primary/60" fill="currentColor" opacity="0.4" />
      <circle cx="165" cy="40" r="3" className="text-primary/60" fill="currentColor" opacity="0.5" />
      <circle cx="150" cy="115" r="1.5" className="text-primary/60" fill="currentColor" opacity="0.3" />
      <circle cx="55" cy="135" r="2" className="text-primary/60" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

function NoTemplates({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full", className)}
    >
      {/* Bookshelf frame - outer */}
      <rect
        x="30"
        y="25"
        width="140"
        height="155"
        rx="4"
        className="text-muted-foreground/30"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      {/* Top shelf */}
      <line
        x1="30"
        y1="75"
        x2="170"
        y2="75"
        className="text-muted-foreground/30"
        stroke="currentColor"
        strokeWidth="3"
      />
      {/* Middle shelf */}
      <line
        x1="30"
        y1="125"
        x2="170"
        y2="125"
        className="text-muted-foreground/30"
        stroke="currentColor"
        strokeWidth="3"
      />
      {/* Leaning book on top shelf (subtle hint of emptiness) */}
      <rect
        x="55"
        y="42"
        width="10"
        height="30"
        rx="1"
        className="text-muted-foreground/30"
        fill="currentColor"
        opacity="0.3"
        transform="rotate(-12 55 42)"
      />
      {/* Single thin book on middle shelf */}
      <rect
        x="130"
        y="82"
        width="8"
        height="38"
        rx="1"
        className="text-muted-foreground/30"
        fill="currentColor"
        opacity="0.25"
      />
      {/* Dust lines on shelves to emphasize emptiness */}
      <line
        x1="80"
        y1="72"
        x2="120"
        y2="72"
        className="text-muted-foreground/30"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.2"
        strokeDasharray="3 5"
      />
      <line
        x1="50"
        y1="122"
        x2="110"
        y2="122"
        className="text-muted-foreground/30"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.2"
        strokeDasharray="3 5"
      />
      <line
        x1="60"
        y1="172"
        x2="130"
        y2="172"
        className="text-muted-foreground/30"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.2"
        strokeDasharray="3 5"
      />
      {/* Plus icon accent - suggesting "add templates" */}
      <circle
        cx="155"
        cy="155"
        r="18"
        className="text-primary/60"
        fill="currentColor"
        opacity="0.1"
      />
      <circle
        cx="155"
        cy="155"
        r="18"
        className="text-primary/60"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <line
        x1="155"
        y1="146"
        x2="155"
        y2="164"
        className="text-primary/60"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="146"
        y1="155"
        x2="164"
        y2="155"
        className="text-primary/60"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const illustrations: Record<string, React.FC<{ className?: string }>> = {
  "no-tenders": NoTenders,
  "no-workflows": NoWorkflows,
  "no-documents": NoDocuments,
  "no-decisions": NoDecisions,
  "no-results": NoResults,
  "first-time": FirstTime,
  "no-templates": NoTemplates,
};

export function EmptyStateIllustration({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const Illustration = illustrations[type];

  if (!Illustration) {
    return null;
  }

  return <Illustration className={className} />;
}
