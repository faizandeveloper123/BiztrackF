export function projectDateKey(s: string): string {
  return s.trim().replace(/T.*$/, "").slice(0, 10);
}
