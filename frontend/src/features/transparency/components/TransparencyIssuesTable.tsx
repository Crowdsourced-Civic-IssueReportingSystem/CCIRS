import { Link } from "react-router-dom";
import { STATUS_OPTIONS } from "../constants";
import { formatIssueDate } from "../utils";
import type { TransparencyIssue } from "../utils";

interface Props {
  issues: TransparencyIssue[];
  isAdmin: boolean;
  savingIssueId: string;
  onChangeStatus: (issueId: string, status: string) => void;
}

export default function TransparencyIssuesTable({ issues, isAdmin, savingIssueId, onChangeStatus }: Props) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2 pr-3">Issue</th>
            <th className="py-2 pr-3">Category</th>
            <th className="py-2 pr-3">Department</th>
            <th className="py-2 pr-3">Current Status</th>
            <th className="py-2 pr-3">Created</th>
            <th className="py-2">{isAdmin ? "Update Status" : "View"}</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr key={issue.id} className="border-b align-top">
              <td className="py-3 pr-3">
                <p className="font-semibold text-slate-900">{issue.title || issue.id}</p>
                <p className="mt-1 line-clamp-2 max-w-md text-xs text-slate-600">{issue.description}</p>
              </td>
              <td className="py-3 pr-3">{issue.category || "-"}</td>
              <td className="py-3 pr-3">{issue.department || "-"}</td>
              <td className="py-3 pr-3">{issue.status || "-"}</td>
              <td className="py-3 pr-3">{formatIssueDate(issue.createdAt as string | number | Date | undefined)}</td>
              <td className="py-3">
                {isAdmin ? (
                  <div className="flex gap-2 items-center">
                    <select
                      disabled={savingIssueId === issue.id}
                      value={issue.status || "OPEN"}
                      onChange={(event) => onChangeStatus(issue.id || "", event.target.value)}
                      className="rounded-soft border px-2 py-1 text-sm"
                      aria-label="Update status"
                      title="Update status"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <Link
                      to={`/track?issueId=${encodeURIComponent(issue.id || "")}`}
                      className="inline-block rounded-soft bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 transition"
                    >
                      View
                    </Link>
                  </div>
                ) : (
                  <Link to={`/track?issueId=${encodeURIComponent(issue.id || "")}`} className="text-sm font-semibold text-primary">
                    Track
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
