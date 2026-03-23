import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchIssues, fetchTransparencyStats, updateIssueStatus } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

function AdminDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingIssueId, setSavingIssueId] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

  const loadData = async () => {
    if (!isAdmin) return;

    setLoading(true);
    try {
      const [issueData, statsData] = await Promise.all([
        fetchIssues(),
        fetchTransparencyStats().catch(() => null),
      ]);
      setIssues(Array.isArray(issueData) ? issueData : []);
      setStats(statsData);
    } catch (error) {
      showToast(error.message || "Failed to load admin data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  const filteredIssues = useMemo(() => {
    if (statusFilter === "ALL") return issues;
    return issues.filter((issue) => issue.status === statusFilter);
  }, [issues, statusFilter]);

  const onChangeStatus = async (issueId, status) => {
    setSavingIssueId(issueId);
    try {
      const updated = await updateIssueStatus(issueId, status);
      setIssues((prev) => prev.map((item) => (item.id === issueId ? { ...item, ...updated } : item)));
      showToast("Issue status updated", "success");
    } catch (error) {
      showToast(error.message || "Failed to update status", "error");
    } finally {
      setSavingIssueId("");
    }
  };

  if (!user) {
    return (
      <div className="panel mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">Please log in with an admin account.</p>
        <Link to="/login" className="btn-primary mt-4 inline-block">
          Go to Login
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="panel mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-red-700">Access denied. Your account does not have ADMIN role.</p>
        <p className="mt-1 text-xs text-slate-600">Current role: {user.role || "unknown"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Moderate civic issues and update resolution status.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-4">
        <div className="panel p-4">
          <p className="text-xs text-slate-500">Total Issues</p>
          <p className="mt-1 text-2xl font-bold">{stats?.totalIssues ?? issues.length}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs text-slate-500">Open</p>
          <p className="mt-1 text-2xl font-bold">{stats?.byStatus?.OPEN ?? issues.filter((i) => i.status === "OPEN").length}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs text-slate-500">In Progress</p>
          <p className="mt-1 text-2xl font-bold">
            {stats?.byStatus?.IN_PROGRESS ?? issues.filter((i) => i.status === "IN_PROGRESS").length}
          </p>
        </div>
        <div className="panel p-4">
          <p className="text-xs text-slate-500">Resolved</p>
          <p className="mt-1 text-2xl font-bold">{stats?.byStatus?.RESOLVED ?? issues.filter((i) => i.status === "RESOLVED").length}</p>
        </div>
      </section>

      <section className="panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-700">Issue Moderation</h2>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-soft border px-3 py-2 text-sm"
          >
            <option value="ALL">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-slate-600">Loading issues...</p>
        ) : filteredIssues.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No issues found.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Issue</th>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3">Department</th>
                  <th className="py-2 pr-3">Current Status</th>
                  <th className="py-2">Update Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map((issue) => (
                  <tr key={issue.id} className="border-b align-top">
                    <td className="py-3 pr-3">
                      <p className="font-semibold text-slate-900">{issue.title || issue.id}</p>
                      <p className="mt-1 line-clamp-2 max-w-md text-xs text-slate-600">{issue.description}</p>
                    </td>
                    <td className="py-3 pr-3">{issue.category || "-"}</td>
                    <td className="py-3 pr-3">{issue.department || "-"}</td>
                    <td className="py-3 pr-3">{issue.status || "-"}</td>
                    <td className="py-3">
                      <select
                        disabled={savingIssueId === issue.id}
                        value={issue.status || "OPEN"}
                        onChange={(event) => onChangeStatus(issue.id, event.target.value)}
                        className="rounded-soft border px-2 py-1 text-sm"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;
