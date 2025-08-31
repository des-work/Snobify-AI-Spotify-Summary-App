import { CardProps } from "./types";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

export default function DiscoveryTrend({ stats }: CardProps){
  const data = stats.discoveryTrend;
  return (
    <div className="card" data-card="discovery">
      <div className="row"><div className="title">Discovery Trend</div><div className="muted">first plays / month</div></div>
      <div style={{height:240}}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{top:6,right:10,left:0,bottom:0}}>
            <XAxis dataKey="month" hide />
            <YAxis width={32}/>
            <Tooltip />
            <Line type="monotone" dataKey="count" dot={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}