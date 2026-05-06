import React from "react";
import { FileText, Receipt, CheckCircle2 } from "lucide-react";

interface DocumentTypeSelectorProps {
  documentType: "invoice" | "retail";
  setDocumentType: (type: "invoice" | "retail") => void;
}

export default function DocumentTypeSelector({
  documentType,
  setDocumentType,
}: DocumentTypeSelectorProps) {
  return (
    <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4 text-brand-400" />
        Τύπος Παραστατικού
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setDocumentType("retail")}
          className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all relative ${
            documentType === "retail"
              ? "border-brand-500 bg-brand-500/10 text-brand-400"
              : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700"
          }`}
        >
          <Receipt className="w-8 h-8" />
          <span className="font-medium">Απόδειξη Λιανικής (B2C)</span>
          {documentType === "retail" && (
            <CheckCircle2 className="w-5 h-5 absolute top-4 right-4" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setDocumentType("invoice")}
          className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all relative ${
            documentType === "invoice"
              ? "border-brand-500 bg-brand-500/10 text-brand-400"
              : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700"
          }`}
        >
          <FileText className="w-8 h-8" />
          <span className="font-medium">Τιμολόγιο (B2B)</span>
          {documentType === "invoice" && (
            <CheckCircle2 className="w-5 h-5 absolute top-4 right-4" />
          )}
        </button>
      </div>
    </div>
  );
}
