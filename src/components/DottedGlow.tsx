import { cn } from "../lib/cn";

/**
 * The blueprint's dotted glow: a dot matrix with two soft radial washes.
 * No blur filters, no animated blobs — just gradients that stay out of the way.
 */
export function DottedGlow({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="dotfield absolute inset-0 opacity-70 [mask-image:radial-gradient(72%_58%_at_50%_28%,black,transparent)]" />
      <div className="absolute top-[-22%] left-1/2 h-[560px] w-[820px] -translate-x-1/2 [background:radial-gradient(50%_50%_at_50%_50%,rgba(0,255,255,0.10),transparent_70%)]" />
      <div className="absolute top-[6%] left-[68%] h-[460px] w-[560px] -translate-x-1/2 [background:radial-gradient(50%_50%_at_50%_50%,rgba(143,0,255,0.12),transparent_70%)]" />
    </div>
  );
}
