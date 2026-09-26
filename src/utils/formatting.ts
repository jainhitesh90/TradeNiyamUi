export function formatBalance(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const amount = typeof value === 'number' ? value : Number(String(value).replace(/[₹,\s]/g, ''));
  if (!Number.isFinite(amount)) {
    return '—';
  }

  const formatted = amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `₹${formatted}`;
}

export function formatPrice(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '—';
}

export function displayValue(value: string | null | undefined): string {
  return value?.trim() ? value : '—';
}

export function initialsFrom(name: string | null | undefined, email: string | null | undefined): string {
  const trimmed = name?.trim() ?? '';
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }

  const emailInitial = email?.trim()[0];
  if (emailInitial) {
    return emailInitial.toUpperCase();
  }
  return '?';
}
