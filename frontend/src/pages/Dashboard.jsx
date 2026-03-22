import { useMemo, useState } from "react";
import IssueCard from "../components/IssueCard";
import { useIssues } from "../context/IssuesContext";

function Dashboard() {
  const { issues } = useIssues();
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const statusMatch = status === "All" || issue.status === status;
      const categoryMatch = category === "All" || issue.category === category;
      return statusMatch && categoryMatch;
    });
  }, [issues, status, category]);

  const byCategory = useMemo(() => {
    return issues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {});
  }, [issues]);

  const categories = ["All", ...Object.keys(byCategory)];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Filter your reported issues and view high-level analytics.</p>
      </header>

      <section className="panel p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="statusFilter" className="mb-1 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              id="statusFilter"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-soft border px-3 py-2 text-sm"
            >
              {["All", "Submitted", "Assigned", "In Progress", "Resolved"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="categoryFilter" className="mb-1 block text-sm font-medium text-slate-700">
              Category
            </label>
            <select
              id="categoryFilter"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-soft border px-3 py-2 text-sm"
            >
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="panel p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Analytics Snapshot</h2>
        <div className="space-y-2">
          {Object.entries(byCategory).map(([name, count]) => (
            <div key={name} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>{name}</span>
                <span>{count}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, count * 20)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredIssues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
      </section>
    </div>
  );
}

export default Dashboard;
