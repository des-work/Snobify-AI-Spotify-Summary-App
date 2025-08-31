import { CardProps } from "./types";
function Bar({ label, v }:{ label:string; v:number }){
  const pct = Math.max(0, Math.min(100, Math.round(v*100)));
  return (
    <div style={{marginBottom:8}}>
      <div className="row"><div className="muted">{label}</div><div className="muted">{pct}%</div></div>
      <div className="progress"><div style={{width:`${pct}%`}}/></div>
    </div>
  );
}
export default function TasteCard({ stats }: CardProps){
  const t = stats.taste;
  return (
    <div className="card" data-card="taste">
      <div className="title">Taste Profile</div>
      <Bar label="Danceability" v={t.avgDanceability}/>
      <Bar label="Energy" v={t.avgEnergy}/>
      <Bar label="Valence" v={t.avgValence}/>
      <Bar label="Acousticness" v={t.acousticBias}/>
      <Bar label="Instrumentalness" v={t.instrumentalBias}/>
      <div className="muted" style={{marginTop:6}}>
        Playlist score — Variety {stats.playlistRater.variety}, Cohesion {stats.playlistRater.cohesion}, Rarity {stats.playlistRater.rarityScore}, Creativity {stats.playlistRater.creativity}, Overall {stats.playlistRater.overall}
      </div>
    </div>
  );
}