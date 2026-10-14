export function formatChatTime(isoString: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}
