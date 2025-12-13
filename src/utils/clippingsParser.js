const CLIP_SEPARATOR = /==========\s*/;

const metaPattern = new RegExp(
  [
    '^-\\s(?:',
    'Your\\s(?<type_en>Highlight|Note)\\s(?:on|at)\\sLocation\\s(?<location_en>[\\d-]+)\\s*\\|\\s*Added\\son\\s(?<date_en>.+)',
    '|',
    '您在位置\\s#?(?<location_zh>[\\d-]+)\\s*的\\s*(?<type_zh>标注|笔记)\\s*\\|\\s*添加于\\s(?<date_zh>.+)',
    ')$'
  ].join(''),
  'i'
);

const fallbackPatterns = [
  /Your\s(?<type>Highlight|Note).*?Location\s*:?(?<location>[\d-]+).*?Added(?:\son)?\s(?<date>.+)/i,
  /您在第.*?位置\s*#?(?<location>[\d-]+).*?(?<type>标注|笔记).*?添加于\s(?<date>.+)/,
  /位置\s*#?(?<location>[\d-]+).*?(?<type>标注|笔记).*?添加于\s(?<date>.+)/,
];

const hashChars = '0123456789abcdef';

function buildHashSet(source) {
  if (!source) {
    return new Set();
  }
  if (source instanceof Set) {
    return source;
  }
  if (Array.isArray(source)) {
    return new Set(source);
  }
  return new Set([source]);
}

function hashString(value = '') {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  let hex = '';
  const unsigned = hash >>> 0;
  for (let i = 0; i < 8; i += 1) {
    const nibble = (unsigned >>> (i * 4)) & 0xf;
    hex = hashChars[nibble] + hex;
  }
  return hex.padStart(8, '0');
}

function standardizeDate(input) {
  if (!input) return input;
  const trimmed = input.trim();
  if (!trimmed) return trimmed;

  const direct = Date.parse(trimmed);
  if (!Number.isNaN(direct)) {
    return new Date(direct).toISOString();
  }

  const zhMatch = trimmed.match(
    /(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日.*?(上午|下午)?\s*(\d{1,2}):(\d{2}):(\d{2})/
  );
  if (zhMatch) {
    const [, y, m, d, ampm, hh, mm, ss] = zhMatch;
    let hour = Number(hh);
    if (ampm === '下午' && hour < 12) {
      hour += 12;
    } else if (ampm === '上午' && hour === 12) {
      hour = 0;
    }
    try {
      return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), hour, Number(mm), Number(ss)))
        .toISOString()
        .replace('Z', '');
    } catch (err) {
      return trimmed;
    }
  }

  const fallback = trimmed.match(
    /(\d{4}).*?(\d{1,2}).*?(\d{1,2}).*?(\d{1,2}):(\d{2}):(\d{2})/
  );
  if (fallback) {
    const [, y, m, d, hh, mm, ss] = fallback;
    try {
      return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss)))
        .toISOString()
        .replace('Z', '');
    } catch (err) {
      return trimmed;
    }
  }

  return trimmed;
}

function parseBookInfo(raw = '') {
  const authorMatch = raw.match(/\(([^)]+)\)\s*$/);
  const author = authorMatch ? authorMatch[1].trim() : 'Unknown';
  const bookTitle = authorMatch ? raw.replace(authorMatch[0], '').trim() : raw.trim();
  return { bookTitle: bookTitle || 'Unknown', author: author || 'Unknown' };
}

function parseMeta(line = '') {
  const cleaned = line.trim();
  let match = cleaned.match(metaPattern);
  if (match && match.groups) {
    const groups = match.groups;
    const type = groups.type_en || groups.type_zh;
    const location = groups.location_en || groups.location_zh || '';
    const date = groups.date_en || groups.date_zh || '';
    return { type: type && /笔记|note/i.test(type) ? 'Note' : 'Highlight', location, date };
  }

  for (const pattern of fallbackPatterns) {
    match = cleaned.match(pattern);
    if (match && match.groups) {
      const { type, location, date } = match.groups;
      return {
        type: type && /笔记|note/i.test(type) ? 'Note' : 'Highlight',
        location: location || '',
        date: date || '',
      };
    }
  }

  return null;
}

export function parseClippings(text = '', options = {}) {
  const existingHashSet = buildHashSet(options.existingHashes);
  const sessionHashSet = new Set();
  const rawClips = text.split(CLIP_SEPARATOR).map((entry) => entry.trim()).filter(Boolean);
  const highlights = [];
  const notesByLocation = new Map();

  rawClips.forEach((clip, index) => {
    const lines = clip
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 3) {
      return;
    }

    const [bookLine, metaLine, ...contentLines] = lines;
    const content = contentLines.join('\n');
    if (!content) {
      return;
    }

    const meta = parseMeta(metaLine);
    if (!meta) {
      return;
    }

    const { bookTitle, author } = parseBookInfo(bookLine);
    const locationKey = (meta.location || '').split('-').pop() || meta.location || String(index);

    const noteEntry = {
      content,
      dateRaw: meta.date,
      date: standardizeDate(meta.date),
      clipIndex: index,
    };

    if (meta.type === 'Note') {
      if (!notesByLocation.has(locationKey)) {
        notesByLocation.set(locationKey, []);
      }
      notesByLocation.get(locationKey).push(noteEntry);
      return;
    }

    const highlightId = hashString(`${bookTitle}||${content}`) + index.toString(16);
    if (existingHashSet.has(highlightId) || sessionHashSet.has(highlightId)) {
      return;
    }
    sessionHashSet.add(highlightId);

    highlights.push({
      id: highlightId,
      book_id: hashString(bookTitle),
      book_title: bookTitle,
      author,
      highlight_content: content,
      location: meta.location,
      date_added_raw: meta.date,
      date_added: standardizeDate(meta.date),
      note_content: null,
      note_date_added: null,
      clip_index: index,
    });
  });

  highlights.forEach((highlight) => {
    const locationKey = (highlight.location || '').split('-').pop() || highlight.location;
    if (!locationKey || !notesByLocation.has(locationKey)) {
      return;
    }
    const candidates = notesByLocation.get(locationKey);
    const after = candidates.filter((note) => note.clipIndex > highlight.clip_index);
    let chosen = null;
    if (after.length) {
      chosen = after.reduce((min, note) => (note.clipIndex < min.clipIndex ? note : min));
    } else {
      chosen = candidates.reduce((min, note) => (note.clipIndex < min.clipIndex ? note : min));
    }
    highlight.note_content = chosen.content;
    highlight.note_date_added = chosen.date;
    const idx = candidates.indexOf(chosen);
    if (idx >= 0) {
      candidates.splice(idx, 1);
    }
    if (!candidates.length) {
      notesByLocation.delete(locationKey);
    }
  });

  return highlights;
}
