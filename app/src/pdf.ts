import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
export async function exportPdf(container: HTMLElement, filename: string){
  const pdf = new jsPDF({ orientation: "p", unit: "px", format: "a4" });
  const cards = Array.from(container.querySelectorAll<HTMLElement>(".card"));
  for(let i=0;i<cards.length;i++){
    const c = cards[i];
    const canvas = await html2canvas(c, { backgroundColor: "#0b0b0f", useCORS: true, scale: 2 });
    const img = canvas.toDataURL("image/png");
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height/canvas.width) * w;
    if(i>0) pdf.addPage();
    pdf.addImage(img, "PNG", 0, 0, w, h);
  }
  pdf.save(`${filename}.pdf`);
}