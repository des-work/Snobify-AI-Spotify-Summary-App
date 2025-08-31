export function shuffle<T>(arr: T[], seed?: string): T[] {
  const a = [...arr];
  let s = 0x2f6e2b1;
  if (seed) for(const ch of seed) s = (s ^ ch.charCodeAt(0)) * 1664525 + 1013904223;
  const rnd = ()=> (s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff;
  for(let i=a.length-1;i>0;i--){ const j = Math.floor(rnd()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; }
  return a;
}