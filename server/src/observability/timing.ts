export class Timer {
  private t0 = globalThis.process?.hrtime?.bigint?.() ?? BigInt(Date.now()*1e6);
  private laps: { name: string; ms: number }[] = [];
  lap(name: string){
    const now = globalThis.process?.hrtime?.bigint?.() ?? BigInt(Date.now()*1e6);
    const ms = Number(now - this.t0) / 1e6;
    this.laps.push({ name, ms: Math.round(ms) });
  }
  header(){
    return this.laps.map(l => `${l.name};dur=${l.ms}`).join(", ");
  }
}