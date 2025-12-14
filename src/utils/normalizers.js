export function normalizeHighlight(raw = {}) {
  const bookData = raw.book || {};
  const bookId =
    raw.bookId ??
    raw.book_id ??
    bookData.id ??
    bookData.book_id ??
    bookData.uuid ??
    '';
  const bookTitle =
    raw.bookTitle ??
    raw.book_title ??
    raw.title ??
    bookData.title ??
    bookData.book_title ??
    '';
  const author =
    raw.author ??
    raw.author_name ??
    bookData.author ??
    bookData.author_name ??
    '';

  return {
    id: raw.id ?? raw.highlight_id ?? raw.uuid ?? '',
    bookId,
    bookTitle,
    author,
    text: raw.text ?? raw.highlight_content ?? raw.content ?? '',
    // 使用后端的 note_content 作为笔记内容，同时兼容其他命名
    note:
      raw.note ??
      raw.note_content ??
      raw.annotation ??
      raw.notes ??
      '',
    noteDate:
      raw.note_date_added ??
      raw.note_date ??
      raw.note_at ??
      null,
    location: raw.location ?? raw.loc ?? raw.position ?? '',
    date: raw.date ?? raw.date_added ?? raw.created_at ?? '',
    raw,
  };
}

export function normalizeBook(raw = {}) {
  const baseId = raw.id ?? raw.book_id ?? raw.uuid ?? '';
  const baseTitle = raw.title ?? raw.book_title ?? raw.name ?? '';
  const baseAuthor = raw.author ?? raw.author_name ?? '';
  const normalizedHighlights = Array.isArray(raw.highlights)
    ? raw.highlights.map((highlight) =>
        normalizeHighlight({
          ...highlight,
          book_id:
            highlight.book_id ??
            highlight.bookId ??
            baseId,
          book_title:
            highlight.book_title ??
            highlight.bookTitle ??
            baseTitle,
          author:
            highlight.author ??
            highlight.author_name ??
            baseAuthor,
        })
      )
    : [];

  // 处理封面 URL：如果是相对路径（如 covers/xxx.jpg），则转为绝对路径
  let coverUrl = raw.coverUrl ?? raw.cover_url ?? raw.cover ?? null;
  if (coverUrl && !coverUrl.startsWith('http://') && !coverUrl.startsWith('https://') && !coverUrl.startsWith('data:')) {
    // 相对路径，补全为绝对路径（假设相对于网站根路径）
    coverUrl = `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, '')}/${coverUrl}`;
  }

  return {
    id: baseId,
    title: baseTitle,
    author: baseAuthor,
    coverUrl,
    highlightsCount:
      raw.highlightsCount ??
      raw.highlights_count ??
      raw.highlight_count ??
      raw.highlights ??
      raw.count ??
      0,
    lastRead:
      raw.lastRead ??
      raw.last_read ??
      raw.last_highlight_date ??
      raw.updated_at ??
      null,
    highlights: normalizedHighlights,
    raw,
  };
}


