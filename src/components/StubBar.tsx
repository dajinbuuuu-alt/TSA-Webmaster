import { getSession, requestAuth } from "../lib/auth";
import { completeNextStub, nextStubLesson, useProgress } from "../lib/progress";

/**
 * Temporary: the lesson content is being written by another team, so this lets
 * the economy be exercised for real. Each credit uses the same lesson keys the
 * real lessons will, and pays exactly once.
 */
export function StubBar() {
  const { count } = useProgress();
  const next = nextStubLesson();

  const onComplete = () => {
    if (!getSession()) {
      requestAuth(() => completeNextStub());
      return;
    }
    completeNextStub();
  };

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-white/10 bg-[#05070a]/78 px-3 py-2 backdrop-blur-[3px]">
      <span className="font-mono text-[9px] tracking-[0.18em] text-dim uppercase">
        Stub lesson · {count} credited
      </span>
      <button
        type="button"
        onClick={onComplete}
        disabled={!next}
        className={
          next
            ? "inline-flex h-8 items-center rounded-[3px] border border-white/20 bg-[#05070a]/80 px-3 text-[12px] text-ink transition-colors hover:bg-white/[0.08]"
            : "inline-flex h-8 cursor-default items-center rounded-[3px] border border-white/10 px-3 text-[12px] text-dim/50"
        }
      >
        {next ? "Complete next lesson" : "All lessons credited"}
      </button>
    </div>
  );
}
