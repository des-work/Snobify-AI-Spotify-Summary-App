export function splitGenres(s: string | undefined | null): string[] {
  if (!s) return [];
  return Array.from(new Set(String(s).split(/[|,]/).map(x => x.trim().toLowerCase()).filter(Boolean)));
}
export function clamp01(x:number){ return Math.max(0, Math.min(1, x)); }
export function lerp(a:number, b:number, t:number){ return a + (b-a)*t; }
export function mapRange(x:number, inMin:number, inMax:number, outMin:number, outMax:number){
  if (inMax === inMin) return outMin;
  const t = (x - inMin) / (inMax - inMin);
  return lerp(outMin, outMax, Math.max(0, Math.min(1, t)));
}