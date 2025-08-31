import "./styles.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchStats, fetchDebug } from "./api/client";
import type { Stats } from "./types";
import SceneDeck, { Scene } from "./components/SceneDeck";
import DebugDock from "./components/DebugDock";
import TopGenres from "./components/cards/TopGenres";
import DiscoveryTrend from "./components/cards/DiscoveryTrend";
import ActivityTrend from "./components/cards/ActivityTrend";
import RareTracks from "./components/cards/RareTracks";
import TasteCard from "./components/cards/TasteCard";
import SnobCard from "./components/cards/SnobCard";
import SummaryCard from "./components/cards/SummaryCard";
import { exportPdf } from "./pdf";
import { exportCardPng } from "./export";

export default function App(){
  const [profile, setProfile] = useState("default");
  const [stats, setStats] = useState<Stats|null>(null);
  const [dockOpen, setDockOpen] = useState(false);
  const [meta, setMeta] = useState<{timings?:string; etag?:string; xhash?:string; latency?:number; debug?: any}>({});
  const [mode, setMode] = useState<"PG13"|"R">("R");
  const [useStats, setUseStats] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{ if(e.key.toLowerCase()==="d") setDockOpen(v=>!v); };
    window.addEventListener("keydown", h); return ()=> window.removeEventListener("keydown",h);
  },[]);

  useEffect(()=>{
    (async ()=>{
      const { data, timings, etag, xhash } = await fetchStats(profile);
      setStats(data.stats);
      const dbg = await fetchDebug(profile).catch(()=>null);
      setMeta({ timings, etag, xhash, latency: (data as any)._latencyMs, debug: dbg });
    })();
  },[profile]);

  // expose toggles for SummaryCard
  useEffect(()=>{ (window as any).__snobify_mode = mode; (window as any).__snobify_useStats = useStats; },[mode, useStats]);

  const scenes: Scene[] = useMemo(()=> stats ? [
    { key: "snob",   position:"start",  el: <SnobCard stats={stats} /> },
    { key: "genres", position:"middle", el: <TopGenres stats={stats} /> },
    { key: "disc",   position:"free",   el: <DiscoveryTrend stats={stats} /> },
    { key: "act",    position:"free",   el: <ActivityTrend stats={stats} /> },
    { key: "taste",  position:"free",   el: <TasteCard stats={stats} /> },
    { key: "rare",   position:"free",   el: <RareTracks stats={stats} /> },
    { key: "summary",position:"end",    el: <SummaryCard stats={stats} /> }
  ] : [], [stats]);

  // Track last clicked/hovered card so header PNG button can export it
  useEffect(()=>{
    const root = containerRef.current;
    if(!root) return;
    function rememberCard(e: MouseEvent){
      const c = (e.target as HTMLElement).closest(".card");
      if(c) (window as any).__snobify_lastCard = c;
    }
    function onPngClick(e: MouseEvent){
      const btn = (e.target as HTMLElement).closest("[data-png]");
      if(!btn) return;
      let card = (e.target as HTMLElement).closest(".card") as HTMLElement | null;
      if(!card) card = (window as any).__snobify_lastCard || null;
      if(!card) return;
      const key  = card.getAttribute("data-card") || "card";
      const hash = stats?.meta.hash.slice(0,8) || "x";
      exportCardPng(card, `Snobify_${profile}_${key}_${hash}`);
    }
    root.addEventListener("click", rememberCard);
    root.addEventListener("click", onPngClick);
    return ()=>{ root.removeEventListener("click", rememberCard); root.removeEventListener("click", onPngClick); }
  }, [stats, profile]);

  return (
    <div className="container" ref={containerRef}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, gap:12, flexWrap:"wrap"}}>
        <h1 style={{margin:0, fontSize:28}}>Snobify 😏</h1>
        <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
          <label className="muted">Mode:
            <select value={mode} onChange={e=>setMode(e.target.value as any)} className="btn" style={{marginLeft:6}}>
              <option value="R">R-rated</option>
              <option value="PG13">PG-13</option>
            </select>
          </label>
          <label className="muted">Use stats:
            <input type="checkbox" checked={useStats} onChange={e=>setUseStats(e.target.checked)} style={{marginLeft:6}}/>
          </label>
          <button className="btn" onClick={()=> setProfile(p=>p)} title="Shuffle free cards">Shuffle</button>
          <button className="btn" onClick={async()=>{
            if(containerRef.current && stats){
              await exportPdf(containerRef.current, `Snobify_${profile}_${stats.meta.hash.slice(0,8)}`);
            }
          }}>Export PDF</button>
          <button className="btn" data-png>📸 PNG (this card)</button>
        </div>
      </div>
      {stats ? <SceneDeck scenes={scenes} /> : <div>Loading…</div>}
      <DebugDock open={dockOpen} onClose={()=>setDockOpen(false)} info={{
        profile, etag: meta.etag, xhash: meta.xhash, timings: meta.timings, latencyMs: meta.latency, rows: stats?.meta.rows, window: stats?.meta.window, debug: meta.debug
      }}/>
      <div style={{position:"fixed", bottom:16, left:16}} className="muted">Press <b>D</b> for Debug Dock • Click a card, then “PNG (this card)”</div>
    </div>
  );
}