import { format, formatDistanceToNow, parseISO } from "date-fns";

/**
 * Format a date string to a readable format
 * @param dateString - ISO date string
 * @param formatStr - Date format pattern (default: "MMM dd, yyyy")
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string,
  formatStr: string = "MMM dd, yyyy"
): string {
  try {
    const date = parseISO(dateString);
    return format(date, formatStr);
  } catch (error) {
    return dateString;
  }
}

/**
 * Format a date to relative time (e.g., "2 hours ago")
 * @param dateString - ISO date string
 * @returns Relative time string
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return dateString;
  }
}

/**
 * Format a number with thousands separators
 * @param num - Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

/**
 * Format a rating to fixed decimal places
 * @param rating - Rating number
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted rating string
 */
export function formatRating(rating: number, decimals: number = 1): string {
  return rating.toFixed(decimals);
}

/**
 * Format a popularity score to percentage
 * @param popularity - Popularity score (0-10)
 * @returns Percentage string
 */
export function formatPopularity(popularity: number): string {
  const percentage = (popularity / 10) * 100;
  return `${percentage.toFixed(0)}%`;
}

/**
 * Truncate text to a maximum length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}