import { CardProps } from "./types";
export default function SnobCard({ stats }: CardProps){
  return (
    <div className="card" data-card="snob">
      <div className="title">Snob says…</div>
      <p style={{fontSize:16, lineHeight:1.5}}>{stats.snob}</p>
    </div>
  );
}