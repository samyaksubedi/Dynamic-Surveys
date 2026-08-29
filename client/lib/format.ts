export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));

export const formatRelative = (value: string) => {
  const days = Math.round((new Date(value).getTime() - Date.now()) / 86_400_000);
  if (Math.abs(days) < 1) return 'Today';
  if (days === -1) return 'Yesterday';
  if (days > -7 && days < 0) return `${Math.abs(days)} days ago`;
  return formatDate(value);
};
