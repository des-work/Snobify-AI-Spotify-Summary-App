import { ReactNode, useMemo } from "react";
import { shuffle } from "../util";

export type Scene = { key: string; el: ReactNode; position?: "start"|"middle"|"end"|"free" };
export default function SceneDeck({ scenes, seed }:{ scenes: Scene[]; seed?: string }){
  const deck = useMemo(()=>{
    const start = scenes.filter(s=>s.position==="start");
    const mid   = scenes.filter(s=>s.position==="middle");
    const end   = scenes.filter(s=>s.position==="end");
    const free  = scenes.filter(s=>!s.position || s.position==="free");
    const rnd   = shuffle(free, seed);
    const half  = Math.floor(rnd.length/2);
    return [...start, ...rnd.slice(0,half), ...mid, ...rnd.slice(half), ...end];
  }, [JSON.stringify(scenes.map(s=>s.key + (s.position||""))), seed]);
  return <div className="grid">{deck.map(s => <div key={s.key}>{s.el}</div>)}</div>;
}