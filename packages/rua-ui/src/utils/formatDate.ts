import { formatDistanceToNow } from "date-fns";

/**
 * Format a date to a relative time string (e.g., "now", "1h", "2d", "3w")
 * Matches Raycast's date formatting style
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  // Just now (< 1 minute)
  if (diffSeconds < 60) {
    return "now";
  }

  // Minutes (< 1 hour)
  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  // Hours (< 1 day)
  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  // Days (< 1 week)
  if (diffDays < 7) {
    return `${diffDays}d`;
  }

  // Weeks (< 4 weeks)
  if (diffWeeks < 4) {
    return `${diffWeeks}w`;
  }

  // Months (< 12 months)
  if (diffMonths < 12) {
    return `${diffMonths}mo`;
  }

  // Years
  return `${diffYears}y`;
}

/**
 * Format a date using date-fns formatDistanceToNow for more verbose output
 */
export function formatRelativeDateVerbose(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}
