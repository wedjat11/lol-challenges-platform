/**
 * Utility functions for the frontend
 */

/**
 * Format a number as currency (coins)
 */
export function formatCoins(amount: number): string {
  return `${amount.toLocaleString()} coins`;
}

/**
 * Format a date to readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.substring(0, length)}...` : str;
}

/**
 * Check if we're in the browser
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined";
}
