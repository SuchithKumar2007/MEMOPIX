import { format, isToday, isYesterday, isThisWeek, parseISO } from 'date-fns';
import { MediaItem } from '../types';

export function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1000;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val.toFixed(2)} ${sizes[i]}`;
}

export function formatDuration(seconds?: number | null): string {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, 'MMM d, yyyy');
  } catch {
    return dateString;
  }
}

export function formatDateLabel(dateString: string): string {
  try {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'MMMM d, yyyy');
  } catch {
    return dateString;
  }
}

export function groupMediaByDate(items: MediaItem[]): { label: string; dateKey: string; items: MediaItem[] }[] {
  const groups: { [key: string]: { label: string; dateKey: string; items: MediaItem[] } } = {};

  items.forEach(item => {
    const date = parseISO(item.createdAt);
    let key = format(date, 'yyyy-MM-dd');
    let label = formatDateLabel(item.createdAt);

    if (!groups[key]) {
      groups[key] = {
        label,
        dateKey: key,
        items: []
      };
    }
    groups[key].items.push(item);
  });

  return Object.values(groups).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}
