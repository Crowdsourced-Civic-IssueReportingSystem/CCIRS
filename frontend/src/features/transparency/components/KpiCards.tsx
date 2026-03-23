export default function KpiCards({
  totals,
}: {
  totals: { total: number; open: number; inProgress: number; resolved: number; resolvedRate: number };
}) {
  const cards = [
    { label: "Total Issues", value: totals.total },
    { label: "Open", value: totals.open },
    { label: "In Progress", value: totals.inProgress },
    { label: "Resolved", value: totals.resolved },
    { label: "Resolution Rate", value: `${totals.resolvedRate}%` },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="panel p-4">
          <p className="text-xs text-slate-500">{card.label}</p>
          <p className="mt-1 text-2xl font-bold">{card.value}</p>
        </div>
      ))}
    </section>
  );
}
