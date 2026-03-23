import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import KpiCards from "../features/transparency/components/KpiCards";
import TransparencyFilters from "../features/transparency/components/TransparencyFilters";
import TransparencyIssuesTable from "../features/transparency/components/TransparencyIssuesTable";
import { useTransparencyDashboard } from "../features/transparency/hooks/useTransparencyDashboard";
import { downloadIssuesCsv } from "../features/transparency/utils";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";
  const {
    loading,
    filteredIssues,
    totals,
    departments,
    savingIssueId,
    statusFilter,
    departmentFilter,
    searchQuery,
    setStatusFilter,
    setDepartmentFilter,
    setSearchQuery,
    loadData,
    onChangeStatus,
  } = useTransparencyDashboard({ isAdmin, showToast });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Public Transparency Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          High-level civic performance view for citizens. {isAdmin ? "Admin moderation controls are enabled." : "Read-only public view."}
        </p>
        {!isAdmin ? (
          <div className="mt-2 text-xs text-slate-500">
            Need moderation access?{" "}
            <Link to="/login" className="font-semibold text-primary">
              Sign in as admin
            </Link>
            .
          </div>
        ) : null}
      </header>

      <KpiCards totals={totals} />

      <section className="panel p-4">
        <TransparencyFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          departments={departments}
          onRefresh={loadData}
          onExport={() => downloadIssuesCsv(filteredIssues)}
        />

        {loading ? (
          <p className="mt-4 text-sm text-slate-600">Loading issues...</p>
        ) : filteredIssues.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No issues found.</p>
        ) : (
          <TransparencyIssuesTable
            issues={filteredIssues}
            isAdmin={isAdmin}
            savingIssueId={savingIssueId}
            onChangeStatus={onChangeStatus}
          />
        )}
      </section>
    </div>
  );
}
