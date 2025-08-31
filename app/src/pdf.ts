import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export async function exportPdf(container: HTMLElement, filename: string){
  const canvas = await html2canvas(container, { backgroundColor: "#0b0b0f", scale: 2 });
  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const ratio = canvas.width / canvas.height;
  const imgW = pageW;
  const imgH = imgW / ratio;

  let y = 0;
  let remaining = imgH;

  // Tile down multiple pages if needed
  while (remaining > 0){
    const sliceH = Math.min(pageH, remaining);
    // Add the same image each page but shift y using addImage 'y' param (works for simple exports)
    pdf.addImage(img, "PNG", 0, -y, imgW, imgH, undefined, "FAST");
    remaining -= pageH;
    y += pageH;
    if (remaining > 0) pdf.addPage();
  }
  pdf.save(`${filename}.pdf`);
}