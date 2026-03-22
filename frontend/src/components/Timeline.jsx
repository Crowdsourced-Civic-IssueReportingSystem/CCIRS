import { CheckCircle2 } from "lucide-react";
import { formatDate } from "../utils/formatDate";

const ordered = ["Submitted", "Assigned", "In Progress", "Resolved"];

function Timeline({ timeline }) {
  const seen = new Set(timeline.map((log) => log.key));

  return (
    <ol className="space-y-4">
      {ordered.map((stage) => {
        const item = timeline.find((log) => log.key === stage);
        const active = seen.has(stage);
        return (
          <li key={stage} className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                active ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-slate-100 text-slate-500"
              }`}
            >
              {active ? <CheckCircle2 className="h-4 w-4" /> : "•"}
            </span>
            <div>
              <p className={`text-sm font-medium ${active ? "text-slate-900" : "text-slate-500"}`}>{stage}</p>
              <p className="text-xs text-slate-500">{item ? formatDate(item.timestamp) : "Awaiting update"}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default Timeline;
