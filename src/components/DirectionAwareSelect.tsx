import { useEffect, useRef, useState, type PointerEvent } from "react";
import { cn } from "../lib/cn";

export type SelectOption = {
  id: string;
  label: string;
  state: "idle" | "correct" | "wrong" | "muted";
};

type Direction = "left" | "right" | "top" | "bottom";
type Frame = { top: number; left: number; width: number; height: number };

type DirectionAwareSelectProps = {
  options: SelectOption[];
  selected: string | null;
  disabled?: boolean;
  onSelect: (id: string) => void;
};

const CORNERS = [
  "-top-[3px] -left-[3px]",
  "-top-[3px] -right-[3px]",
  "-bottom-[3px] -left-[3px]",
  "-bottom-[3px] -right-[3px]",
];

/**
 * Answer list with a design-tool selection frame that slides to the row under
 * the pointer, plus a fill that arrives from the edge the pointer entered.
 */
export function DirectionAwareSelect({
  options,
  selected,
  disabled = false,
  onSelect,
}: DirectionAwareSelectProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const rows = useRef(new Map<string, HTMLButtonElement>());
  const [frame, setFrame] = useState<Frame | null>(null);
  const [entry, setEntry] = useState<{ id: string; dir: Direction } | null>(null);

  const verdict = options.find((option) => option.id === selected)?.state;
  const frameTone = verdict === "wrong" ? "border-rose/70" : "border-signal/70";
  const tagTone = verdict === "wrong" ? "text-rose/70" : "text-signal/70";

  const measure = (id: string) => {
    const row = rows.current.get(id);
    const list = listRef.current;
    if (!row || !list) return;

    const rowRect = row.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    setFrame({
      top: rowRect.top - listRect.top,
      left: rowRect.left - listRect.left,
      width: rowRect.width,
      height: rowRect.height,
    });
  };

  useEffect(() => {
    if (!selected) {
      setFrame(null);
      return;
    }

    measure(selected);
    const onResize = () => measure(selected);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // measure only depends on the selected id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const onRowEnter = (event: PointerEvent<HTMLButtonElement>, id: string) => {
    if (disabled) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const dir: Direction =
      Math.abs(x) > Math.abs(y) ? (x > 0 ? "right" : "left") : y > 0 ? "bottom" : "top";

    setEntry({ id, dir });
    if (!selected) measure(id);
  };

  const onListLeave = () => {
    setEntry(null);
    if (!selected) setFrame(null);
  };

  return (
    <div
      ref={listRef}
      role="group"
      aria-label="Answer choices"
      onPointerLeave={onListLeave}
      className="relative mt-4 space-y-2"
    >
      {frame && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-10 transition-all duration-200 ease-out"
          style={{
            top: frame.top,
            left: frame.left,
            width: frame.width,
            height: frame.height,
          }}
        >
          <span className={cn("absolute inset-0 border", frameTone)} />
          {CORNERS.map((corner) => (
            <span
              key={corner}
              className={cn("absolute h-[5px] w-[5px] bg-[#0f1319] border", frameTone, corner)}
            />
          ))}
          <span
            className={cn(
              "absolute -top-[15px] right-0 font-mono text-[8.5px] tracking-[0.14em] uppercase",
              tagTone,
            )}
          >
            {Math.round(frame.width)} × {Math.round(frame.height)}
          </span>
        </div>
      )}

      {options.map((option, index) => {
        const isSelected = option.id === selected;

        return (
          <button
            key={option.id}
            ref={(node) => {
              if (node) rows.current.set(option.id, node);
              else rows.current.delete(option.id);
            }}
            type="button"
            onClick={() => onSelect(option.id)}
            onPointerEnter={(event) => onRowEnter(event, option.id)}
            onFocus={() => {
              if (!selected) measure(option.id);
            }}
            disabled={disabled}
            aria-pressed={isSelected}
            className={cn(
              "relative flex w-full items-start gap-3 overflow-hidden rounded-[3px] border px-3 py-2.5 text-left text-[12.5px] leading-5 transition-colors",
              option.state === "idle" &&
                "border-white/[0.08] bg-white/[0.02] text-ink/85 hover:border-white/25",
              option.state === "correct" && "border-signal/50 bg-signal/[0.06] text-ink",
              option.state === "wrong" && "border-rose/50 bg-rose/[0.07] text-ink/90",
              option.state === "muted" && "border-white/[0.05] text-dim/60",
            )}
          >
            {entry && entry.id === option.id && (
              <span
                key={`${option.id}-${entry.dir}`}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  animation: `fill-${entry.dir} 300ms cubic-bezier(0.22, 1, 0.36, 1) both`,
                  background: "rgba(234, 241, 248, 0.05)",
                }}
              />
            )}

            <span
              className={cn(
                "relative mt-[1px] grid h-5 w-5 shrink-0 place-items-center rounded-[2px] border font-mono text-[10px]",
                option.state === "correct"
                  ? "border-signal/60 text-signal"
                  : option.state === "wrong"
                    ? "border-rose/60 text-rose"
                    : "border-white/15 text-dim",
              )}
            >
              {String.fromCharCode(65 + index)}
            </span>
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
