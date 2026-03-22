const colorMap = {
  OPEN: "bg-yellow-100 text-yellow-800 border-yellow-200",
  ASSIGNED: "bg-amber-100 text-amber-700 border-amber-200",
  IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
  RESOLVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CLOSED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
  Assigned: "bg-amber-100 text-amber-700 border-amber-200",
  Submitted: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

function StatusBadge({ status }) {
  const colors = colorMap[status] || "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${colors}`}>
      {status}
    </span>
  );
}

export default StatusBadge;
