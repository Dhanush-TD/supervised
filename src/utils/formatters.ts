export function getCategoryStyle(category: string): {
  bg: string;
  text: string;
  border: string;
  badge: string;
  gradient: string;
  accent: string;
  iconName: 'trophy' | 'check-circle' | 'alert-circle';
} {
  const cat = (category || '').toLowerCase();
  if (cat.includes('excellent') || cat.includes('distinction') || cat.includes('a')) {
    return {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-300',
      badge: 'bg-emerald-600 text-white',
      gradient: 'from-emerald-600 to-teal-700',
      accent: 'emerald',
      iconName: 'trophy'
    };
  }
  if (cat.includes('good') || cat.includes('merit') || cat.includes('pass') || cat.includes('b')) {
    return {
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-300',
      badge: 'bg-blue-600 text-white',
      gradient: 'from-blue-600 to-indigo-700',
      accent: 'blue',
      iconName: 'check-circle'
    };
  }
  // Poor / Needs Improvement
  return {
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-300',
    badge: 'bg-rose-600 text-white',
    gradient: 'from-rose-600 to-orange-600',
    accent: 'rose',
    iconName: 'alert-circle'
  };
}

export function formatScore(num: number | undefined | null, decimals = 1): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}

export function exportToCSV(filename: string, rows: Record<string, any>[]): void {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers
        .map(header => {
          const val = row[header] === undefined || row[header] === null ? '' : String(row[header]);
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
