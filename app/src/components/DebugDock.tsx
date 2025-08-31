export default function DebugDock({ open, onClose, info }:{ open:boolean; onClose:()=>void; info:any }){
  if(!open) return null;
  return (
    <div className="debug">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <b>Debug</b>
        <button className="btn" onClick={onClose}>Close</button>
      </div>
      <div className="muted" style={{marginBottom:8}}>ETag: {info?.etag} • Hash: {info?.xhash}</div>
      <div className="muted" style={{marginBottom:8}}>Latency: {info?.latencyMs} ms • Timing: {info?.timings}</div>
      <div className="muted" style={{marginBottom:8}}>Rows: {info?.rows} • Window: {info?.window?.start} → {info?.window?.end}</div>
      <pre style={{whiteSpace:"pre-wrap",fontSize:12, maxHeight:200, overflow:"auto"}}>{JSON.stringify(info?.debug, null, 2)}</pre>
    </div>
  );
}