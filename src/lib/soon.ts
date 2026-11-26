/**
 * The mockup has no router yet, so anything that would navigate fires this
 * event instead and a small toast explains that the full build wires it up.
 */
export const SOON_EVENT = "mockup:soon";

export function announceSoon() {
  window.dispatchEvent(new Event(SOON_EVENT));
}
