import { CardProps } from "./types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function WrapTick(props:any){
  const { x, y, payload } = props;
  const label = String(payload.value ?? "");
  // split on space near 14 chars
  let l1 = label, l2 = "";
  if(label.length > 14){
    const idx = label.lastIndexOf(" ", 14);
    if(idx > 0){ l1 = label.slice(0,idx); l2 = label.slice(idx+1); }
  }
  return (
    <text x={x} y={y} textAnchor="middle" fill="#9aa0a6" fontSize={10}>
      <tspan x={x} dy="0.75em">{l1}</tspan>
      {l2 && <tspan x={x} dy="1.1em">{l2}</tspan>}
    </text>
  );
}

export default function TopGenres({ stats }: CardProps){
  const data = stats.topUniqueGenres.slice(0, 12)
    .map(d=>({ name: d.genre.split(/[|,]/).slice(0,1)[0], count: d.count }));
  return (
    <div className="card" data-card="genres">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div className="title">Top Unique Genres</div>
        <div className="muted">Counted once per track • normalized</div>
      </div>
      <div style={{height:300}}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{top:8,right:16,left:8,bottom:24}}>
            <XAxis dataKey="name" interval={0} height={34} tick={<WrapTick/>}/>
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}