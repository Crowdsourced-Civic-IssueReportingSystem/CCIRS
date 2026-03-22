function IssueCard({ title, status, location }) {
  return (
    <article className="issue-card">
      <h3>{title}</h3>
      <p>Status: {status}</p>
      <p>Location: {location}</p>
    </article>
  );
}

export default IssueCard;
