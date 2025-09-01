import React, { useEffect, useMemo, useRef, useState } from "react";
import { defaultEngineConfig, type EngineConfig } from "./config";
import "./transitions.css";

// Position pins (same semantic as your SceneDeck)
export type ScenePosition = "start" | "middle" | "end" | "free";

// Gate flags a scene might require
export type Gate = "always" | "rareEligible" | "hasName";

export type SceneDef = {
  key: string;
  position?: ScenePosition;
  gate?: Gate;
  render: (ctx: {
    index: number;
    total: number;
    userName?: string;
    tone: "serious" | "dry" | "snarky";
    // future data slices can be added here (taste, playlists, etc.)
  }) => React.ReactNode;
};

function seededShuffle<T>(arr: T[], seed = "seed") {
  // Mulberry32
  let h = 1779033703 ^ seed.split("").reduce((a,c)=> (a<<5)-a + c.charCodeAt(0), 0);
  const rand = () => ((h = Math.imul(h ^ (h >>> 16), 2246822507),
                       h = Math.imul(h ^ (h >>> 13), 3266489909),
                       (h ^= h >>> 16) >>> 0) / 4294967296);
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function computeOrder(scenes: SceneDef[], cfg: EngineConfig) {
  const start = scenes.filter(s=>s.position==="start");
  const mid   = scenes.filter(s=>s.position==="middle");
  const end   = scenes.filter(s=>s.position==="end");
  const free  = scenes.filter(s=>!s.position || s.position==="free");
  const core  = cfg.deterministic ? seededShuffle(free, cfg.seed ?? "snobify") : free;
  const half  = Math.floor(core.length/2);
  return [...start, ...core.slice(0,half), ...mid, ...core.slice(half), ...end];
}

function toneForIndex(i:number, total:number): "serious"|"dry"|"snarky" {
  const t = i / Math.max(1,total-1);
  if (t < 0.33) return "serious";
  if (t < 0.66) return "dry";
  return "snarky";
}

type Props = {
  scenes: SceneDef[];
  gates?: { rareEligible?: boolean; hasName?: boolean };
  config?: Partial<EngineConfig>;
  userName?: string;
  onSceneStart?: (key:string, index:number)=>void;
  onSceneEnd?: (key:string, index:number)=>void;
};

export default function SceneEngine({
  scenes,
  gates,
  config,
  userName,
  onSceneStart,
  onSceneEnd
}: Props){
  const cfg: EngineConfig = { ...defaultEngineConfig, ...(config||{}) };
  const name = userName || (typeof localStorage!=="undefined" ? localStorage.getItem("snobify_name")||undefined : undefined);

  // Gate filter
  const gated = useMemo(()=> scenes.filter(s=>{
    if (s.gate === "rareEligible") return !!gates?.rareEligible;
    if (s.gate === "hasName") return !!name;
    return true;
  }), [JSON.stringify(scenes.map(s=>s.key + (s.gate||""))), gates?.rareEligible, name]);

  const deck = useMemo(()=> computeOrder(gated, cfg), [JSON.stringify(gated.map(s=>s.key+(s.position||""))), cfg.deterministic, cfg.seed]);

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"enter"|"show"|"exit">("enter");
  const timerRef = useRef<number|undefined>();

  // autoplay driver
  useEffect(()=>{
    if(!cfg.autoPlay || deck.length===0) return;
    setPhase("enter");
    const showMs = Math.max(2, cfg.sceneDurationSec) * 1000;

    // enter -> show -> exit -> next
    const t1 = window.setTimeout(()=> setPhase("show"), 300);
    const t2 = window.setTimeout(()=> setPhase("exit"), showMs - 400);
    const t3 = window.setTimeout(()=>{
      onSceneEnd?.(deck[idx]?.key, idx);
      if (idx < deck.length - 1) setIdx(i=>i+1);
      setPhase("enter");
    }, showMs);
    timerRef.current = t3;
    onSceneStart?.(deck[idx]?.key, idx);
    return ()=> { window.clearTimeout(t1); window.clearTimeout(t2); window.clearTimeout(t3); };
  }, [idx, deck.length, cfg.autoPlay, cfg.sceneDurationSec]);

  // keyboard: left arrow to go back; right arrow disabled unless dev sets allowSkipForward=true
  useEffect(()=>{
    const h = (e:KeyboardEvent)=>{
      if(e.key==="ArrowLeft" && idx>0){ e.preventDefault(); setIdx(i=>i-1); }
      if(e.key==="ArrowRight"){ /* intentionally noop to prevent skipping forward */ }
    };
    window.addEventListener("keydown", h); return ()=> window.removeEventListener("keydown", h);
  }, [idx]);

  const canBack = idx>0;
  const tone = toneForIndex(idx, deck.length);
  const showDots = cfg.overlays.showDots;
  const showArrows = cfg.overlays.showArrows;

  const scene = deck[idx];
  return (
    <div className="scene-engine">
      <div className={`scene stage-${phase}`}>
        {scene?.render({ index: idx, total: deck.length, userName: name, tone })}
        {showDots && <div className="overlay dots" aria-hidden />}
        {showArrows && <div className="overlay arrows" aria-hidden />}
      </div>

      {/* controls */}
      <div className="scene-controls">
        <button className="btn" disabled={!canBack} onClick={()=> setIdx(i=>Math.max(0,i-1))}>⟵ Back</button>
        <button className="btn" disabled title="Forward disabled during first run">⟶ Next</button>
        <div className="muted">{idx+1} / {deck.length} • tone: {tone}</div>
      </div>
    </div>
  );
}