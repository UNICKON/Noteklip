const pad2 = (value) => String(value).padStart(2, '0');

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}-${month}-${day}`;
};

const formatLocalDateTime = (date) => {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hour = pad2(date.getHours());
  const minute = pad2(date.getMinutes());
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

export function formatDisplayDate(input) {
  if (!input) {
    return { short: '', full: '' };
  }

  const raw = String(input).trim();
  if (!raw) {
    return { short: '', full: '' };
  }

  // Treat date-only strings as a plain date to avoid timezone shifts.
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { short: raw, full: raw };
  }

  const timestamp = Date.parse(raw);
  if (!Number.isNaN(timestamp)) {
    const d = new Date(timestamp);
    const short = formatLocalDate(d);
    const hasTime = /\d{1,2}:\d{2}/.test(raw);
    return {
      short,
      // Standardized hover format.
      full: hasTime ? formatLocalDateTime(d) : short,
    };
  }

  const isoMatch = raw.match(/^\d{4}-\d{2}-\d{2}/);
  const short = isoMatch ? isoMatch[0] : raw;
  return {
    short,
    full: short,
  };
}
