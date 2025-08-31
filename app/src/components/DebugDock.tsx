import React from "react";
export default function DebugDock({ open, onClose, info }:{ open:boolean; onClose:()=>void; info:any }){
  if(!open) return null;
  return (
    <div style={{position:"fixed",right:12,bottom:12,background:"#121218",border:"1px solid #1f2029",borderRadius:12,padding:12,maxWidth:420,boxShadow:"0 10px 30px rgba(0,0,0,.4)", zIndex:50}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div className="title">Debug Dock</div>
        <button className="btn" onClick={onClose}>Close</button>
      </div>
      <pre style={{whiteSpace:"pre-wrap", fontSize:11, color:"#9aa0a6"}}>
{JSON.stringify(info,null,2)}
      </pre>
    </div>
  );
}