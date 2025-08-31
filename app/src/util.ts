export function shuffle<T>(arr:T[], seed?:string){
  if(!seed) return [...arr].sort(()=>Math.random()-0.5);
  let s = [...seed].reduce((a,c)=>a + c.charCodeAt(0), 0);
  const rnd = ()=> (s = (s*1664525 + 1013904223) % 2**32) / 2**32;
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){ const j = Math.floor(rnd()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
export const clamp = (n:number, lo=0, hi=100)=> Math.max(lo, Math.min(hi, n));