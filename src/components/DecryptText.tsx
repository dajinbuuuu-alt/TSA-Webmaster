import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../lib/cn";

const NOISE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+/<>";

function scramble(text: string) {
  return text
    .split("")
    .map((char) => (char === " " ? char : NOISE[Math.floor(Math.random() * NOISE.length)]))
    .join("");
}

type DecryptTextProps = {
  text: string;
  className?: string;
  trigger?: "mount" | "view";
};

/**
 * Decodes text out of cipher noise. The final string sits invisibly underneath
 * so the line never reflows; reduced-motion users get the plain text.
 */
export function DecryptText({ text, className, trigger = "mount" }: DecryptTextProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const [started, setStarted] = useState(trigger === "mount" && !reducedMotion);
  const [output, setOutput] = useState(() => (reducedMotion ? text : scramble(text)));

  useEffect(() => {
    if (trigger !== "view" || reducedMotion) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion, trigger]);

  useEffect(() => {
    if (!started || reducedMotion) {
      setOutput(text);
      return;
    }

    let tick = 0;
    const total = text.length;

    const interval = window.setInterval(() => {
      tick += 1;
      const revealed = Math.max(0, Math.min(total, Math.floor((tick - 4) * 1.6)));

      if (revealed >= total) {
        setOutput(text);
        window.clearInterval(interval);
        return;
      }

      setOutput(
        text
          .split("")
          .map((char, index) =>
            index < revealed || char === " "
              ? char
              : NOISE[Math.floor(Math.random() * NOISE.length)],
          )
          .join(""),
      );
    }, 40);

    return () => window.clearInterval(interval);
  }, [reducedMotion, started, text]);

  return (
    <span ref={ref} className={cn("relative inline-block", className)}>
      <span aria-hidden="true" className="invisible">
        {text}
      </span>
      <span aria-hidden="true" className="absolute inset-0 whitespace-pre">
        {output}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
