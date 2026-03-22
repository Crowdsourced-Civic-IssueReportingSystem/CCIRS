import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useToast } from "../context/ToastContext";

const tone = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
};

function Toast() {
  const { toast, clearToast } = useToast();
  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div className={`flex items-start gap-3 rounded-soft border px-4 py-3 shadow-soft ${tone[toast.type] || tone.success}`}>
        {toast.type === "error" ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
        <p className="text-sm font-medium">{toast.message}</p>
        <button onClick={clearToast} className="text-slate-500 transition hover:text-slate-700" aria-label="Close toast">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default Toast;
