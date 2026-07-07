"use client";

export default function ProjectPrintButton() {
  function handlePrint() {
    window.print();
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-300 transition hover:bg-blue-500/20"
    >
      Export / Print PDF
    </button>
  );
}