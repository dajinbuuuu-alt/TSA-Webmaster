import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { DirectionAwareSelect, type SelectOption } from "./DirectionAwareSelect";
import { getSession, requestAuth } from "../lib/auth";
import { ramFor, xpFor } from "../lib/economy";
import { completeLesson } from "../lib/progress";
import { cn } from "../lib/cn";

type Option = {
  id: string;
  label: string;
  correct: boolean;
  note: string;
};

const OPTIONS: Option[] = [
  {
    id: "a",
    label: "Searched the web for the answer",
    correct: false,
    note: "Models only search when a tool is attached.",
  },
  {
    id: "b",
    label: "Predicted the next word from its training data",
    correct: true,
    note: "It predicts one word at a time, with no lookup and no reasoning.",
  },
  {
    id: "c",
    label: "Looked it up in a database of websites",
    correct: false,
    note: "No database, just patterns, so details drift.",
  },
];

/**
 * A working slice of the lesson player: one question, immediate feedback and an
 * explanation. This is the same component the units will use, not a screenshot.
 */
export function LessonPreview() {
  const [selected, setSelected] = useState<string | null>(null);
  const [awarded, setAwarded] = useState(false);
  const choice = OPTIONS.find((option) => option.id === selected) ?? null;

  const options: SelectOption[] = OPTIONS.map((option) => ({
    id: option.id,
    label: option.label,
    state:
      selected === null
        ? "idle"
        : option.correct
          ? "correct"
          : option.id === selected
            ? "wrong"
            : "muted",
  }));

  const award = () => {
    completeLesson({
      unitId: "unit-0",
      lessonId: "lesson-1",
      kind: "lesson",
      score: choice?.correct ? 1 : 0,
      total: 1,
      firstTry: choice?.correct ?? false,
    });
    setAwarded(true);
  };

  const onContinue = () => {
    if (!getSession()) {
      requestAuth(award);
      return;
    }
    award();
  };

  const done = awarded;
  const perfect = choice?.correct ?? false;

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-[4px] border border-hairline/80 bg-[#0f1319] shadow-[0_30px_70px_-50px_rgba(0,0,0,0.9)]">
        <div className="h-[2px] w-full bg-white/[0.06]">
          <div className="h-full w-1/3 bg-signal" />
        </div>

        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <span className="font-mono text-[9.5px] tracking-[0.18em] text-dim uppercase">
            Unit 0 · Lesson 1 of 3
          </span>
          <span className="font-mono text-[9.5px] tracking-[0.18em] text-dim uppercase">
            2 min
          </span>
        </div>

        <div className="p-5">
          <p className="text-[13.5px] leading-6 text-ink">
            A model answers your homework question perfectly. What did it just do?
          </p>

          <DirectionAwareSelect
            options={options}
            selected={selected}
            disabled={selected !== null}
            onSelect={setSelected}
          />

          {choice && (
            <div
              className={cn(
                "mt-4 border-l-2 pl-3 text-[12px] leading-5 text-dim",
                choice.correct ? "border-signal/60" : "border-rose/60",
              )}
            >
              <span className={cn("font-medium", choice.correct ? "text-signal" : "text-rose")}>
                {choice.correct ? "Correct." : "Not quite."}
              </span>{" "}
              {choice.note}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3">
          <span className="font-mono text-[10px] tracking-[0.14em] text-dim uppercase">
            +{xpFor("lesson", perfect)} XP · +{ramFor("lesson", perfect)} RAM
          </span>
          <button
            type="button"
            onClick={selected && !done ? onContinue : undefined}
            disabled={!selected || done}
            className={cn(
              "inline-flex h-8 items-center gap-2 rounded-[3px] px-3.5 text-[12px] font-medium transition-colors",
              selected && !done
                ? "bg-brand text-white hover:bg-[#7b00de]"
                : "cursor-not-allowed bg-white/[0.05] text-dim/60",
            )}
          >
            {done ? "Counted" : selected ? "Continue" : "Choose an answer"}
            {selected && !done && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
