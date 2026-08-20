function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function toTimeString(totalMinutes: number): string {
  const clamped = Math.min(23 * 60 + 59, Math.max(0, totalMinutes));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Shifts `end` by the same delta as start→newStart, preserving the event's duration. */
export function computeRescheduledEnd(start: string, end: string, newStart: string): string {
  const delta = toMinutes(newStart) - toMinutes(start);
  return toTimeString(toMinutes(end) + delta);
}
