import { CardProps } from "./types";

export default function RareTracks({ stats }: CardProps){
  const rows = stats.rareTracks.slice(0, 10);
  return (
    <div className="card" data-card="rare">
      <div className="row"><div className="title">Rare Tracks</div><div className="muted">lowest popularity</div></div>
      <table>
        <thead><tr><th>Track</th><th>Artist</th><th style={{textAlign:"right"}}>Pop</th></tr></thead>
        <tbody>
        {rows.map((r,i)=>(
          <tr key={i}><td>{r.name}</td><td>{r.artist}</td><td style={{textAlign:"right"}}>{r.pop}</td></tr>
        ))}
        </tbody>
      </table>
    </div>
  );
}