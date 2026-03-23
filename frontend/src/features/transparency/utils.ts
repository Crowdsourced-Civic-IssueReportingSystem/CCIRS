import type { IssueDto, TransparencyStats } from "../../types/api";

export type TransparencyIssue = IssueDto;

export function getDepartments(issues: TransparencyIssue[]): string[] {
  return [...new Set((issues || []).map((issue) => issue.department).filter(Boolean) as string[])];
}

export function filterIssues(
  issues: TransparencyIssue[],
  filters: {
    statusFilter: string;
    departmentFilter: string;
    searchQuery: string;
    allFilter: string;
  }
): TransparencyIssue[] {
  const { statusFilter, departmentFilter, searchQuery, allFilter } = filters;
  const query = searchQuery.trim().toLowerCase();

  return (issues || []).filter((issue) => {
    const matchesStatus = statusFilter === allFilter || issue.status === statusFilter;
    const matchesDepartment = departmentFilter === allFilter || issue.department === departmentFilter;
    const searchable = `${issue.id || ""} ${issue.title || ""} ${issue.description || ""}`.toLowerCase();
    const matchesQuery = !query || searchable.includes(query);
    return matchesStatus && matchesDepartment && matchesQuery;
  });
}

export function calculateTotals(issues: TransparencyIssue[], stats: TransparencyStats | null) {
  const list = issues || [];
  const total = stats?.totalIssues ?? list.length;
  const open = stats?.byStatus?.OPEN ?? list.filter((item) => item.status === "OPEN").length;
  const inProgress = stats?.byStatus?.IN_PROGRESS ?? list.filter((item) => item.status === "IN_PROGRESS").length;
  const resolved = stats?.byStatus?.RESOLVED ?? list.filter((item) => item.status === "RESOLVED").length;
  const resolvedRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  return { total, open, inProgress, resolved, resolvedRate };
}

export function formatIssueDate(value?: string | number | Date): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

export function downloadIssuesCsv(issues: TransparencyIssue[]): void {
  const rows = [
    ["Issue ID", "Title", "Category", "Department", "Status", "Created At"],
    ...(issues || []).map((issue) => [
      issue.id || "",
      issue.title || "",
      issue.category || "",
      issue.department || "",
      issue.status || "",
      issue.createdAt || "",
    ]),
  ];
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ccirs-transparency-issues.csv";
  link.click();
  URL.revokeObjectURL(url);
}
