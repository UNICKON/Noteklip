import re
import hashlib
import yaml
import pymysql
import requests
from typing import List, Dict, Any, Optional
from datetime import datetime

def parse_kindle_clippings_final(text: str) -> List[Dict[str, Any]]:
    """
    解析Kindle 'My Clippings.txt' 文件的内容。
    此最终版本修正了正则表达式，使其能够稳健地处理位置和分隔符周围的各种空格情况，
    确保所有格式的标注和笔记都能被正确解析和关联。

    Args:
        text: 'My Clippings.txt' 文件的原始文本内容。

    Returns:
        一个字典列表，每个字典代表一个标注（Highlight），并包含其关联的笔记（Note）。
    """
    clippings_raw = re.split(r'==========\s*', text.strip())

    highlights = []
    notes = {}  # 临时存储笔记, key为location, value为列表，元素为{content,date,clip_index}
    clip_index = 0

    def generate_unique_id(book_title: str, highlight_content: str) -> str:
        """
        基于书名和摘录内容生成 MD5 唯一 ID。
        """
        combined = f"{book_title}||{highlight_content}"
        return hashlib.md5(combined.encode('utf-8')).hexdigest()

    def generate_book_id(book_title: str) -> str:
        """
        基于书名生成 MD5 唯一 ID。
        """
        return hashlib.md5(book_title.encode('utf-8')).hexdigest()

    # 最终修正版正则表达式，增强了对空格的适应性
    meta_pattern = re.compile(r"""
        ^-\s
        (?:
            # --- 分支1: 英文格式 (US/UK) ---
            Your\s(?P<type_en>Highlight|Note)\s
            (?:on|at)\sLocation\s
            (?P<location_en>[\d-]+)\s*\|\s*  # 修正：允许'|'前后有0或多个空格
            Added\son\s
            (?P<date_en>.+)
        |
            # --- 分支2: 中文格式 ---
            您在位置\s#?
            (?P<location_zh>[\d-]+)\s*的     # 修正：允许位置和'的'之间有0或多个空格
            (?P<type_zh>标注|笔记)\s*\|\s*   # 修正：允许'|'前后有0或多个空格
            添加于\s
            (?P<date_zh>.+)
        )$
    """, re.VERBOSE | re.IGNORECASE)

    def standardize_date(date_str: str) -> str:
        """
        尝试将常见的中/英日期字符串解析为 ISO8601 格式 `YYYY-MM-DDTHH:MM:SS`。
        如果无法解析则返回原始字符串。
        """
        if not date_str:
            return date_str
        s = date_str.strip()

        # 尝试解析中文格式，例如: 2025年11月30日星期日 下午9:54:26
        m = re.search(r"(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日.*?(上午|下午)?\s*(\d{1,2}):(\d{2}):(\d{2})", s)
        if m:
            year, month, day, meridiem, hour, minute, second = m.groups()
            h = int(hour)
            if meridiem:
                if meridiem == '下午' and h < 12:
                    h += 12
                if meridiem == '上午' and h == 12:
                    h = 0
            try:
                dt = datetime(int(year), int(month), int(day), h, int(minute), int(second))
                return dt.strftime('%Y-%m-%dT%H:%M:%S')
            except Exception:
                return s

        # 常见的英文时间格式尝试
        patterns = [
            "%A, %B %d, %Y %I:%M:%S %p",
            "%A, %B %d, %Y %H:%M:%S",
            "%A, %d %B %Y %H:%M:%S",
            "%A, %d %B %Y %I:%M:%S %p",
            "%B %d, %Y %I:%M:%S %p",
            "%d %B %Y %H:%M:%S",
            "%Y-%m-%d %H:%M:%S",
        ]
        for p in patterns:
            try:
                dt = datetime.strptime(s, p)
                return dt.strftime('%Y-%m-%dT%H:%M:%S')
            except Exception:
                continue

        # 兜底：提取数字日期和时间
        m2 = re.search(r"(\d{4}).*?(\d{1,2}).*?(\d{1,2}).*?(\d{1,2}):(\d{2}):(\d{2})", s)
        if m2:
            y, mo, d, hh, mi, ss = m2.groups()
            try:
                dt = datetime(int(y), int(mo), int(d), int(hh), int(mi), int(ss))
                return dt.strftime('%Y-%m-%dT%H:%M:%S')
            except Exception:
                return s

        return s

    # 第一次遍历：分离标注和笔记
    for clip in clippings_raw:
        if not clip: continue
        parts = [p.strip() for p in clip.strip().split('\n') if p.strip()]
        if len(parts) < 3:
            clip_index += 1
            continue

        book_info_raw, meta_raw, content = parts[0], parts[1], parts[2]

        author_match = re.search(r'\(([^)]+)\)$', book_info_raw)
        author = author_match.group(1) if author_match else "Unknown"
        book_title = book_info_raw.replace(f'({author})', '').strip()

        meta_match = meta_pattern.match(meta_raw)
        if not meta_match:
            # 备用解析：尝试一系列更宽松的英文与中文 meta 模式，完全基于 meta_raw 提取信息（不依赖摘录语言）
            groups = None

            # 严格中文 (原先)
            chinese_strict = re.search(r"您在位置\s*#?([\d]+(?:-[\d]+)?)\s*(?:的)?\s*(标注|笔记)\s*\|\s*添加于\s*(.+)", meta_raw)
            if chinese_strict:
                loc_m, type_m, date_m = chinese_strict.group(1), chinese_strict.group(2), chinese_strict.group(3).strip()
                groups = {'type_en': None, 'location_en': None, 'date_en': None,
                          'location_zh': loc_m, 'type_zh': type_m, 'date_zh': date_m}

            # 严格英文 (原先)
            if not groups:
                english_strict = re.search(r"Your\s(Highlight|Note)\s(?:on|at)\sLocation\s([\d-]+)\s*\|\s*Added(?:\son)?\s*(.+)", meta_raw, re.IGNORECASE)
                if english_strict:
                    type_m, loc_m, date_m = english_strict.group(1), english_strict.group(2), english_strict.group(3).strip()
                    groups = {'type_en': type_m, 'location_en': loc_m, 'date_en': date_m,
                              'location_zh': None, 'type_zh': None, 'date_zh': None}

            # 宽松英文变体：例如包含 'page'、括号、不同的 'Added on' 格式等
            if not groups:
                english_variants = [
                    r"Your\s(Highlight|Note).*?Location\s*:?\s*([\d-]+).*?Added(?:\son)?\s*(.+)",
                    r"Your\s(Highlight|Note).*?on\spage.*?\(?Location[: ]*([\d-]+)\)?.*?Added(?:\son)?\s*(.+)",
                    r"-\s*(Highlight|Note)\s*at\s*location\s*([\d-]+)\s*\|\s*Added[: ]*(.+)",
                ]
                for pat in english_variants:
                    m = re.search(pat, meta_raw, re.IGNORECASE)
                    if m:
                        type_m, loc_m, date_m = m.group(1), m.group(2), m.group(3).strip()
                        groups = {'type_en': type_m, 'location_en': loc_m, 'date_en': date_m,
                                  'location_zh': None, 'type_zh': None, 'date_zh': None}
                        break

            # 宽松中文变体：处理包含页码或 '第 X 页（位置 #...）' 等格式
            if not groups:
                chinese_variants = [
                    r"您在第\s*\d+\s*页[^(]*\(位置\s*#?([\d]+(?:-[\d]+)?)\).*?(标注|笔记).*?添加于\s*(.+)",
                    r"位置\s*#?([\d]+(?:-[\d]+)?).*?(标注|笔记).*?添加于\s*(.+)",
                ]
                for pat in chinese_variants:
                    m = re.search(pat, meta_raw)
                    if m:
                        loc_m = m.group(1)
                        # 有时第二组是类型，有时不是，尝试安全获取
                        type_m = m.group(2) if m.lastindex and m.lastindex >= 2 else '标注'
                        date_m = m.group(3).strip() if m.lastindex and m.lastindex >= 3 else ''
                        groups = {'type_en': None, 'location_en': None, 'date_en': None,
                                  'location_zh': loc_m, 'type_zh': type_m, 'date_zh': date_m}
                        break

            if not groups:
                print(f"[DEBUG] meta not matched: {meta_raw!r}")
                continue
            
        if meta_match:
            groups = meta_match.groupdict()
        
        clip_type_raw = groups['type_en'] or groups['type_zh']
        location = groups['location_en'] or groups['location_zh']
        # 规范化用于内部匹配的 location key：使用位置范围的尾部数字（例如 '34-34' -> '34'）
        location_key = location.split('-')[-1] if location else location
        date_added = groups['date_en'] or groups['date_zh']
        date_added_iso = standardize_date(date_added)
        
        clip_type_normalized = 'Note' if clip_type_raw in ['Note', '笔记'] else 'Highlight'

        if clip_type_normalized == 'Note':
            # 存储为列表以允许同一位置有多个笔记（按出现顺序匹配）
            # 使用规范化的尾部数字作为 key，确保与 highlights 的匹配逻辑一致
            notes.setdefault(location_key, []).append({"content": content, "date_raw": date_added, "date": date_added_iso, "clip_index": clip_index})
        else:
            highlights.append({
                "id": generate_unique_id(book_title, content),
                "book_id": generate_book_id(book_title),
                "book_title": book_title, "author": author,
                "highlight_content": content, "location": location,
                "date_added_raw": date_added, "date_added": date_added_iso, "note_content": None,
                "note_date_added": None, "clip_index": clip_index
            })

        clip_index += 1

    # 第二次遍历：将笔记关联到对应的标注
    for highlight in highlights:
        highlight_loc_end = highlight['location'].split('-')[-1]
        if highlight_loc_end not in notes:
            continue

        # 找到在该 highlight 之后出现的第一个 note（按 clip_index）
        candidate_notes = [n for n in notes[highlight_loc_end] if n['clip_index'] > highlight.get('clip_index', -1)]
        if not candidate_notes:
            # 若没有在后面的 note，则尝试匹配最近的之前的 note
            candidate_notes = notes[highlight_loc_end]

        # 选择 clip_index 最小的候选（即最接近 highlight 的下一个或最近的）
        candidate = min(candidate_notes, key=lambda x: x['clip_index'])
        # 从列表中移除已匹配的 note
        notes[highlight_loc_end].remove(candidate)
        if not notes[highlight_loc_end]:
            del notes[highlight_loc_end]

        highlight['note_content'] = candidate['content']
        highlight['note_date_added'] = candidate['date']

    return highlights

def write_to_mysql(highlights: List[Dict[str, Any]], yaml_path: str = 'db_config.yaml') -> None:
    """
    将解析后的 highlights 写入 MySQL。
    配置从 yaml_path 读取，格式示例见 `db_config.yaml`。
    如果数据库或表不存在，尝试创建（会使用可用权限）。
    """
    # 读取配置
    with open(yaml_path, 'r', encoding='utf-8') as f:
        cfg = yaml.safe_load(f)

    host = cfg.get('host', '127.0.0.1')
    port = int(cfg.get('port', 3306))
    user = cfg.get('user')
    password = cfg.get('password')
    dbname = cfg.get('dbname')

    # 尝试连接到指定数据库；若数据库不存在则先连接到服务器并创建
    try:
        conn = pymysql.connect(host=host, port=port, user=user, password=password, db=dbname, charset='utf8mb4')
    except pymysql.err.OperationalError:
        conn = pymysql.connect(host=host, port=port, user=user, password=password, charset='utf8mb4')
        conn.autocommit(True)
        with conn.cursor() as cur:
            cur.execute(f"CREATE DATABASE IF NOT EXISTS `{dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        conn.close()
        conn = pymysql.connect(host=host, port=port, user=user, password=password, db=dbname, charset='utf8mb4')

    try:
        with conn.cursor() as cur:
            # 创建表
            cur.execute("""
            CREATE TABLE IF NOT EXISTS books (
                book_id VARCHAR(64) PRIMARY KEY,
                book_title TEXT,
                original_title TEXT,
                author VARCHAR(255),
                cover_url TEXT
            ) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
            """)

            cur.execute("""
            CREATE TABLE IF NOT EXISTS highlights (
                id VARCHAR(64) PRIMARY KEY,
                book_id VARCHAR(64),
                highlight_content LONGTEXT,
                location VARCHAR(50),
                date_added_raw VARCHAR(255),
                date_added DATETIME,
                note_content LONGTEXT,
                note_date_added DATETIME,
                clip_index INT,
                FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE SET NULL
            ) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
            """)

            # 批量插入书目（去重）
            books = {}
            for h in highlights:
                books[h['book_id']] = (
                    h['book_id'],
                    h['book_title'],
                    h.get('original_title', h['book_title']),
                    h.get('author'),
                    h.get('cover_url'),
                )

            book_vals = list(books.values())
            if book_vals:
                cur.executemany(
                    "INSERT INTO books (book_id, book_title, original_title, author, cover_url) VALUES (%s, %s, %s, %s, %s) "
                    "ON DUPLICATE KEY UPDATE book_title=VALUES(book_title), original_title=VALUES(original_title), author=VALUES(author), cover_url=VALUES(cover_url)",
                    book_vals
                )

            # 插入 highlights
            insert_sql = (
                "INSERT INTO highlights (id, book_id, highlight_content, location, date_added_raw, date_added, note_content, note_date_added, clip_index) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) ON DUPLICATE KEY UPDATE highlight_content=VALUES(highlight_content), note_content=VALUES(note_content), note_date_added=VALUES(note_date_added)"
            )

            rows = []
            for h in highlights:
                # 尝试将 ISO 日期转换为 datetime
                date_added = None
                note_date = None
                try:
                    if h.get('date_added') and 'T' in h.get('date_added'):
                        date_added = datetime.fromisoformat(h.get('date_added'))
                except Exception:
                    date_added = None
                try:
                    if h.get('note_date_added') and 'T' in str(h.get('note_date_added')):
                        note_date = datetime.fromisoformat(h.get('note_date_added'))
                except Exception:
                    note_date = None

                rows.append((
                    h.get('id'), h.get('book_id'), h.get('highlight_content'), h.get('location'),
                    h.get('date_added_raw'), date_added, h.get('note_content'), note_date, h.get('clip_index')
                ))

            if rows:
                cur.executemany(insert_sql, rows)

        conn.commit()
    finally:
        conn.close()


def get_cover_from_google(book_title: str, author: Optional[str], api_key: str) -> Optional[str]:
    """使用 Google Books API 根据书名+作者获取封面 URL。"""
    if author:
        q = f"{book_title}+inauthor:{author}"
    else:
        q = book_title.replace(" ", "+")

    params = {
        "q": q,
        "maxResults": 5,
        "printType": "books",
    }
    if api_key:
        params["key"] = api_key

    try:
        resp = requests.get("https://www.googleapis.com/books/v1/volumes", params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        print(resp.url)
    except requests.RequestException:
        return None

    items = data.get("items") or []
    if not items:
        return None

    volume_info = items[0].get("volumeInfo", {})
    image_links = volume_info.get("imageLinks") or {}

    for key in ["extraLarge", "large", "medium", "small", "thumbnail", "smallThumbnail"]:
        if key in image_links:
            return image_links[key]
    return None


def update_missing_covers(api_key: str, yaml_path: str = 'db_config.yaml', limit: int = 200) -> int:
    """
    为 books 表中 cover_url 为空的记录补全封面。
    返回成功更新的条数。
    """
    with open(yaml_path, 'r', encoding='utf-8') as f:
        cfg = yaml.safe_load(f)

    conn = pymysql.connect(
        host=cfg.get('host', '127.0.0.1'),
        port=int(cfg.get('port', 3306)),
        user=cfg.get('user'),
        password=cfg.get('password'),
        db=cfg.get('dbname'),
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor,
    )

    updated = 0
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT book_id, book_title, original_title, author FROM books "
                "WHERE cover_url IS NULL OR cover_url = '' LIMIT %s",
                (limit,),
            )
            rows = cur.fetchall()

            for row in rows:
                # 优先使用 original_title 作为搜索书名
                title_for_search = row.get('original_title') or row.get('book_title')
                author = row.get('author')
                cover = get_cover_from_google(title_for_search, author, api_key)
                if cover:
                    cur.execute(
                        "UPDATE books SET cover_url=%s WHERE book_id=%s",
                        (cover, row['book_id']),
                    )
                    updated += 1

        if updated:
            conn.commit()
    finally:
        conn.close()

    return updated
# 运行入口：从文件读取 clippings 文本，写入 `out.json`，并同步写入 MySQL。
if __name__ == '__main__':
    import sys, os, json

    # 优先使用命令行第一个参数作为输入文件路径，否则尝试默认文件名
    input_path = sys.argv[1] if len(sys.argv) > 1 else 'My Clippings.txt'
    if not os.path.exists(input_path):
        # 如果默认路径不存在，尝试我们添加的示例文件
        if os.path.exists('My Clippings.txt'):
            input_path = 'My Clippings.txt'
        else:
            print(f"输入文件不存在: {input_path}")
            sys.exit(1)

    with open(input_path, 'r', encoding='utf-8-sig') as f:
        clippings_text = f.read()

    parsed_data = parse_kindle_clippings_final(clippings_text)

    # 1) 写入 JSON 文件，方便调试和查看
    out_path = 'out.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(parsed_data, f, ensure_ascii=False, indent=4)
    print(f"解析完成：{len(parsed_data)} 条 highlight，已写入 {out_path}")

    # 2) 写入 MySQL 数据库
    try:
        write_to_mysql(parsed_data, yaml_path='db_config.yaml')
        print("数据已写入 MySQL。")
    except Exception as e:
        # 不影响解析结果，只在控制台提示写库失败原因
        print(f"写入 MySQL 失败：{e}")
