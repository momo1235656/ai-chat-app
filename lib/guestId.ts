const GUEST_ID_KEY = "ai_chat_guest_id";

export function getOrCreateGuestId(): string {
  if (typeof window === "undefined") return "";

  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}
