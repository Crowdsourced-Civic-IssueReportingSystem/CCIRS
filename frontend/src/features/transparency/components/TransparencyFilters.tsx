import { ALL_FILTER, STATUS_OPTIONS } from "../constants";

interface Props {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  departmentFilter: string;
  setDepartmentFilter: (value: string) => void;
  departments: string[];
  onRefresh: () => void;
  onExport: () => void;
}

export default function TransparencyFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  departmentFilter,
  setDepartmentFilter,
  departments,
  onRefresh,
  onExport,
}: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="grid flex-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-soft border px-3 py-2 text-sm"
            placeholder="Issue ID, title, description"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-soft border px-3 py-2 text-sm"
          >
            <option value={ALL_FILTER}>All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Department</label>
          <select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            className="w-full rounded-soft border px-3 py-2 text-sm"
          >
            {departments.map((department) => (
              <option key={department} value={department}>
                {department === ALL_FILTER ? "All departments" : department}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn-secondary text-xs" onClick={onRefresh}>
          Refresh
        </button>
        <button type="button" className="btn-primary text-xs" onClick={onExport}>
          Export CSV
        </button>
      </div>
    </div>
  );
}
