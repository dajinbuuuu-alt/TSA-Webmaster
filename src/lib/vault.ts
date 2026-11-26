export const VAULT_EVENT = "synapse:vault";

export function openVault() {
  window.dispatchEvent(new Event(VAULT_EVENT));
}
