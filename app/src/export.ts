import html2canvas from "html2canvas";

export async function exportCardPng(el: HTMLElement, filename: string){
  const canvas = await html2canvas(el, { backgroundColor: "#0b0b0f", useCORS: true, scale: 2 });
  // Watermark
  const ctx = canvas.getContext("2d")!;
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.font = "bold 16px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  const pad = 12;
  ctx.fillText("Snobify", canvas.width - ctx.measureText("Snobify").width - pad, canvas.height - pad);
  ctx.restore();

  const uri = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = uri; a.download = `${filename}.png`; a.click();
}