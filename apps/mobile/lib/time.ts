export function formatRelativeTime(timestamp: number) {
  const diff = Math.max(1, Math.round((Date.now() - timestamp) / 60000));

  if (diff < 60) {
    return `${diff}m ago`;
  }

  if (diff < 24 * 60) {
    return `${Math.round(diff / 60)}h ago`;
  }

  return `${Math.round(diff / 1440)}d ago`;
}
