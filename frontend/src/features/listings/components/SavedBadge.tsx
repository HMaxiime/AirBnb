import "./SavedBadge.css";

interface SavedBadgeProps {
  count: number;
}

export function SavedBadge({ count }: SavedBadgeProps): React.JSX.Element | null {
  if (count === 0) return null;
  return (
    <div className="saved-badge">
      <span className="saved-badge-icon">♥</span>
      {count} {count === 1 ? "saved" : "saved"}
    </div>
  );
}
