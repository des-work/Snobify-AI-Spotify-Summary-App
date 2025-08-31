import { CardProps } from "./types";
export default function ComingSoon({ title }: { title:string }){
  return <div className="card"><div className="title">{title}</div><div className="muted">Coming soon…</div></div>;
}
export function mk(title:string){
  return function Placeholder(_: CardProps){ return <ComingSoon title={title}/>; }
}