import { ArrowRight, CheckCircle2, Clock3, MapPinned, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import IssueCard from "../components/IssueCard";
import Loader from "../components/Loader";
import { useIssues } from "../context/IssuesContext";

function Home() {
  const { issues, stats, loading, error } = useIssues();

  const statCards = [
    { label: "Resolved", value: stats.resolved, icon: CheckCircle2, tone: "text-emerald-700 bg-emerald-50" },
    { label: "Active", value: stats.active, icon: Wrench, tone: "text-blue-700 bg-blue-50" },
    { label: "Pending", value: stats.pending, icon: Clock3, tone: "text-amber-700 bg-amber-50" },
  ];

  return (
    <div className="space-y-8">
      <section className="panel overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white sm:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-100">Citizen-first civic response</p>
        <h1 className="max-w-2xl text-2xl font-bold sm:text-4xl">Report issues quickly. Track resolution transparently.</h1>
        <p className="mt-3 max-w-2xl text-sm text-blue-100 sm:text-base">
          CCIRS helps residents report local civic issues and follow every update from submission to closure.
        </p>
        <Link to="/report" className="mt-5 inline-flex items-center gap-2 rounded-soft bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">
          Report Issue <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {statCards.map((item) => (
          <div key={item.label} className="panel p-4">
            <div className={`inline-flex rounded-soft p-2 ${item.tone}`}>
              <item.icon className="h-4 w-4" />
            </div>
            <p className="mt-3 text-2xl font-bold">{item.value}</p>
            <p className="text-sm text-slate-600">{item.label} Issues</p>
          </div>
        ))}
      </section>

      <section className="panel p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <MapPinned className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">City Map Preview</h2>
        </div>
        <div className="h-64 rounded-soft border border-dashed border-slate-300 bg-gradient-to-r from-slate-100 to-blue-50 p-4">
          <div className="flex h-full items-center justify-center text-sm text-slate-500">Interactive issue heatmap placeholder</div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Issues</h2>
          <Link to="/dashboard" className="text-sm font-semibold text-primary hover:text-blue-700">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="panel p-4">
            <Loader text="Loading recent issues..." />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-40 animate-pulse rounded-soft bg-slate-100" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="panel p-4 text-sm text-red-600">Unable to load recent issues: {error}</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {issues.slice(0, 3).map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
