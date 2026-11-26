export const PROFILE_EVENT = "synapse:profile";

export function openProfile() {
  window.dispatchEvent(new Event(PROFILE_EVENT));
}
