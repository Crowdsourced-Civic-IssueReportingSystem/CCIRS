import { Clock3, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDate } from "../utils/formatDate";
import StatusBadge from "./StatusBadge";

function IssueCard({ issue }) {
  const imageSrc = typeof issue.image === "string" ? issue.image.trim() : "";

  return (
    <Link
      to={`/track?issueId=${encodeURIComponent(issue.id)}`}
      className="panel block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label={`Open tracking details for ${issue.id}`}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={issue.title}
          className="h-36 w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : null}
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">{issue.title}</h3>
          <StatusBadge status={issue.status} />
        </div>
        <p className="line-clamp-2 text-sm text-slate-600">{issue.description}</p>
        <div className="space-y-1 text-xs text-slate-500">
          <p className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {issue.location}
          </p>
          <p className="flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" /> {formatDate(issue.createdAt)}
          </p>
          <p className="flex items-center gap-1 text-blue-700 font-semibold">
            <span role="img" aria-label="Upvotes">👍</span> {issue.voteCount}
          </p>
        </div>
        <p className="text-xs font-semibold text-primary">{issue.id}</p>
      </div>
    </Link>
  );
}

export default IssueCard;
