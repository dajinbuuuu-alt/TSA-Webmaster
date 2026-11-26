export type ToastTone = "gain" | "spend" | "warn" | "info";

export type ToastDetail = { text: string; tone: ToastTone };

export const TOAST_EVENT = "synapse:toast";

/** One short line, bottom of the screen. Used for spends, refunds and refusals. */
export function showToast(text: string, tone: ToastTone = "info") {
  window.dispatchEvent(new CustomEvent<ToastDetail>(TOAST_EVENT, { detail: { text, tone } }));
}
