import { useState } from "react";
import nyanzviLogo from "@/assets/nyanzvi-logo.png";
import { cn } from "@/lib/utils";

// Uses the resolved event image; falls back to a Tourism Workforce branded panel
// if there is none or the external URL has expired.
export function EventImage({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div className={cn("gradient-hero flex items-center justify-center", className)} aria-label="Tourism Workforce event">
        <img src={nyanzviLogo} alt="" className="h-12 w-12 opacity-70" />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} className={cn("object-cover", className)} />;
}
