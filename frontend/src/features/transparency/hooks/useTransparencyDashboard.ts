import { useCallback, useEffect, useMemo, useState } from "react";
import type { IssueDto, TransparencyStats } from "../../../types/api";
import { fetchIssues, fetchPublicIssues, fetchTransparencyStats, updateIssueStatus } from "../../../services/api";
import { ALL_FILTER, DEFAULT_PUBLIC_ISSUE_LIMIT } from "../constants";
import { calculateTotals, filterIssues, getDepartments } from "../utils";

type ToastFn = (message: string, type?: "success" | "error" | "warning") => void;

export function useTransparencyDashboard({ isAdmin, showToast }: { isAdmin: boolean; showToast: ToastFn }) {
  const [issues, setIssues] = useState<IssueDto[]>([]);
  const [stats, setStats] = useState<TransparencyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingIssueId, setSavingIssueId] = useState("");

  const [statusFilter, setStatusFilter] = useState(ALL_FILTER);
  const [departmentFilter, setDepartmentFilter] = useState(ALL_FILTER);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const issueData = await (isAdmin ? fetchIssues() : fetchPublicIssues(DEFAULT_PUBLIC_ISSUE_LIMIT));
      const statsData = await fetchTransparencyStats().catch(() => null);
      setIssues(Array.isArray(issueData) ? issueData : []);
      setStats(statsData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load transparency data";
      showToast(message, "error");
      setIssues([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const departments = useMemo(() => [ALL_FILTER, ...getDepartments(issues)], [issues]);

  const filteredIssues = useMemo(
    () =>
      filterIssues(issues, {
        statusFilter,
        departmentFilter,
        searchQuery,
        allFilter: ALL_FILTER,
      }),
    [issues, statusFilter, departmentFilter, searchQuery]
  );

  const totals = useMemo(() => calculateTotals(issues, stats), [issues, stats]);

  const onChangeStatus = useCallback(
    async (issueId: string, status: string) => {
      if (!isAdmin) return;
      setSavingIssueId(issueId);
      try {
        const updated = await updateIssueStatus(issueId, status);
        setIssues((prev) => prev.map((item) => (item.id === issueId ? { ...item, ...updated } : item)));
        showToast("Issue status updated", "success");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update status";
        showToast(message, "error");
      } finally {
        setSavingIssueId("");
      }
    },
    [isAdmin, showToast]
  );

  return {
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
  };
}
