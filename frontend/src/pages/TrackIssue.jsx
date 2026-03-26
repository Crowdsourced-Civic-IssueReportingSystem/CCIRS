import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Loader from "../components/Loader";
import StatusBadge from "../components/StatusBadge";
import Timeline from "../components/Timeline";
import { useIssues } from "../context/IssuesContext";
import { formatDate } from "../utils/formatDate";

function TrackIssue() {
  const { loadIssueById } = useIssues();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const runSearch = async (issueId) => {
    if (!issueId.trim()) return;
    setLoading(true);
    const issue = await loadIssueById(issueId.trim());
    setSelected(issue);
    setLoading(false);
  };

  useEffect(() => {
    const issueId = searchParams.get("issueId");
    if (!issueId) return;
    setQuery(issueId);
    setSearched(true);
    runSearch(issueId);
  }, [searchParams]);

  const onSearch = async (event) => {
    event.preventDefault();
    setSearched(true);
    await runSearch(query);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Track Issue</h1>
        <p className="mt-1 text-sm text-slate-600">Enter your issue ID to view live status updates and timeline logs.</p>
      </header>

      <form onSubmit={onSearch} className="panel p-4 sm:p-5">
        <label htmlFor="issueId" className="mb-2 block text-sm font-medium text-slate-700">
          Issue ID
        </label>
        <div className="flex gap-2">
          <input
            id="issueId"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ex: CC-10021"
            className="w-full rounded-soft border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button className="btn-primary" type="submit">
            <Search className="h-4 w-4" />
          </button>
        </div>
      </form>

      {loading ? (
        <div className="panel p-4">
          <Loader text="Loading issue timeline..." />
        </div>
      ) : selected ? (
        <section className="panel grid gap-6 p-5 md:grid-cols-2">
          <div className="space-y-3">
            {selected.image && (
              <img
                src={selected.image}
                alt={selected.title}
                className="mb-2 max-h-64 w-full rounded-soft object-cover border"
                style={{ background: '#f3f4f6' }}
                onError={e => (e.currentTarget.style.display = 'none')}
              />
            )}
            <p className="text-xs font-semibold text-primary">{selected.id}</p>
            <h2 className="text-lg font-semibold">{selected.title}</h2>
            <p className="text-sm text-slate-600">{selected.description}</p>
            <StatusBadge status={selected.status} />
            <p className="text-xs text-slate-500">Last updated: {formatDate(selected.timeline[selected.timeline.length - 1]?.timestamp)}</p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Progress Timeline</h3>
            <Timeline timeline={selected.timeline} />
          </div>
        </section>
      ) : searched ? (
        <div className="panel p-4 text-sm text-red-600">No issue found for this ID. Check and try again.</div>
      ) : null}
    </div>
  );
}

export default TrackIssue;
