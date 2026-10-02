import capitalize from 'lodash/capitalize';
import compact from 'lodash/compact';
import find from 'lodash/find';
import groupBy from 'lodash/groupBy';
import indexOf from 'lodash/indexOf';
import isFinite from 'lodash/isFinite';
import isInteger from 'lodash/isInteger';
import isNaN from 'lodash/isNaN';
import isNil from 'lodash/isNil';
import isNumber from 'lodash/isNumber';
import last from 'lodash/last';
import map from 'lodash/map';
import replace from 'lodash/replace';
import size from 'lodash/size';
import split from 'lodash/split';
import toLower from 'lodash/toLower';
import toNumber from 'lodash/toNumber';
import toString from 'lodash/toString';
import toUpper from 'lodash/toUpper';
import trim from 'lodash/trim';

const EMPTY = '—';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] as const;

const MONTHLY_CONTRACT = /^([A-Z]+?)(\d{2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d+(?:\.\d+)?)(CE|PE)$/;

const INR: Intl.NumberFormatOptions = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

export function formatBalance(value: number | string | null | undefined): string {
  if (isNil(value) || value === '') {
    return EMPTY;
  }

  const amount = isNumber(value) ? value : toNumber(replace(toString(value), /[₹,\s]/g, ''));
  if (!isFinite(amount)) {
    return EMPTY;
  }

  return `₹${amount.toLocaleString('en-IN', INR)}`;
}

export function formatPrice(value: number): string {
  return isFinite(value) ? value.toFixed(2) : EMPTY;
}

export function formatRupee(value: number): string {
  if (!isFinite(value)) {
    return EMPTY;
  }
  return `₹${Math.abs(value).toLocaleString('en-IN', INR)}`;
}

export function formatPnl(value: number): string {
  const amount = formatRupee(value);
  if (value < 0) {
    return `-${amount}`;
  }
  if (value > 0) {
    return `+${amount}`;
  }
  return amount;
}

export function formatFill(quantity: number, price: number): string {
  const qty = isInteger(quantity) ? toString(quantity) : quantity.toFixed(2);
  return `${qty} ${formatRupee(price)}`;
}

export function formatPlainNumber(value: number | null): string {
  return isNil(value) ? '' : toString(value);
}

export function displayValue(value: string | null | undefined): string {
  const text = isNil(value) ? '' : value;
  return trim(text) ? text : EMPTY;
}

export function initialsFrom(name: string | null | undefined, email: string | null | undefined): string {
  const parts = compact(split(trim(isNil(name) ? '' : name), /\s+/));
  if (size(parts) >= 2) {
    return toUpper(`${parts[0][0]}${last(parts)?.[0] ?? ''}`);
  }
  if (size(parts) === 1) {
    return toUpper(parts[0].slice(0, 2));
  }

  const emailInitial = trim(isNil(email) ? '' : email)[0];
  return emailInitial ? toUpper(emailInitial) : '?';
}

export function titleCase(value: string): string {
  if (size(value) === 2) {
    return value;
  }
  return capitalize(value);
}

export function normalizePhone(value: string): string {
  return replace(value, /[\s()-]/g, '');
}

export function shortRuleName(name: string): string {
  return trim(replace(name, /\s+(per day|for the day)\b/gi, ''));
}

export function sanitizeDigits(value: string, maxLength = 6): string {
  return replace(value, /[^\d]/g, '').slice(0, maxLength);
}

export function sanitizeDecimal(value: string, maxLength = 6, decimals = 2): string {
  const cleaned = replace(value, /[^\d.]/g, '').slice(0, maxLength);
  const dot = cleaned.indexOf('.');
  if (dot === -1) {
    return cleaned;
  }
  const fraction = replace(cleaned.slice(dot + 1), /\./g, '').slice(0, decimals);
  return `${cleaned.slice(0, dot + 1)}${fraction}`;
}

export function formatOrderDate(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatOrderTime(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatTradeDate(value: string): string {
  const [year, month, day] = map(split(value, '-'), toNumber);
  if (!year || !month || !day) {
    return value || EMPTY;
  }
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatContractName(symbol: string): string {
  if (!symbol) {
    return '';
  }
  const match = MONTHLY_CONTRACT.exec(symbol);
  if (!match) {
    return symbol;
  }

  const [, underlying, year, month, strike, option] = match;
  const monthIndex = indexOf(MONTHS, month);
  const expiryDay = lastTuesday(2000 + toNumber(year), monthIndex);
  const monthLabel = capitalize(toLower(month));
  const optionLabel = option === 'CE' ? 'Call' : 'Put';
  return `${underlying} ${expiryDay} ${monthLabel} ${strike} ${optionLabel}`;
}

export function groupByLabel<T>(items: T[], labelOf: (item: T) => string): { title: string; data: T[] }[] {
  return map(groupBy(items, labelOf), (data, title) => ({ title, data }));
}

export function formatLockMessage(epochMs: number, nowMs = Date.now()): string {
  const pause = istParts(epochMs);
  const now = istParts(nowMs);
  const sameDay = pause.day === now.day && pause.month === now.month && pause.year === now.year;
  const when = sameDay ? 'today' : `${pause.day} ${pause.month} ${pause.year}`;
  return `F&O trading locked until ${pause.time} for ${when}`;
}

function lastTuesday(year: number, monthIndex: number): number {
  const lastDay = new Date(year, monthIndex + 1, 0);
  const daysAfterTuesday = (lastDay.getDay() - 2 + 7) % 7;
  return lastDay.getDate() - daysAfterTuesday;
}

function istParts(epochMs: number): { day: string; month: string; year: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(new Date(epochMs));
  const value = (type: Intl.DateTimeFormatPartTypes) => find(parts, (part) => part.type === type)?.value ?? '';
  return {
    day: value('day'),
    month: value('month'),
    year: value('year'),
    time: trim(`${value('hour')}:${value('minute')} ${toLower(value('dayPeriod'))}`),
  };
}
