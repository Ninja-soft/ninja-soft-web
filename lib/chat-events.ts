export const OPEN_CHAT = "ns:open-chat";

export function openChat() {
  window.dispatchEvent(new Event(OPEN_CHAT));
}
