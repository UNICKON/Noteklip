from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import io
import json
import zipfile

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.responses import StreamingResponse
import pymysql
import yaml
from fastapi.middleware.cors import CORSMiddleware

from main import parse_kindle_clippings_final, write_to_mysql


app = FastAPI(title="Klip Backend API", description="通过 FastAPI 提供 Kindle 划线解析、CRUD 与统计/导出接口")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # 或者 ["*"] 在本地调试用
    allow_credentials=True,
    allow_methods=["*"],            # 这里要包含 "OPTIONS"
    allow_headers=["*"],
)
def load_db_config(path: str = "db_config.yaml") -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_connection():
    cfg = load_db_config()
    return pymysql.connect(
        host=cfg.get("host", "127.0.0.1"),
        port=int(cfg.get("port", 3306)),
        user=cfg.get("user"),
        password=cfg.get("password"),
        db=cfg.get("dbname"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


@app.post("/upload-clippings")
async def upload_clippings(file: UploadFile = File(...)):
    """
    上传 Kindle My Clippings.txt 文件，解析并写入 MySQL。
    返回解析出的条数。
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="未提供文件名")

    content_bytes = await file.read()
    try:
        text = content_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        # 兜底为 utf-8
        text = content_bytes.decode("utf-8", errors="ignore")

    highlights = parse_kindle_clippings_final(text)

    try:
        write_to_mysql(highlights, yaml_path="db_config.yaml")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"写入数据库失败: {e}")

    return {"count": len(highlights)}


@app.get("/books")
def list_books(
    q: Optional[str] = Query(None, description="按书名模糊搜索"),
    author: Optional[str] = Query(None, description="按作者名模糊搜索"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    sort: str = Query(
        "latest_desc",
        regex="^(latest_desc|latest_asc|title_asc|title_desc|author_asc|author_desc|count_desc)$",
        description=(
            "排序方式: latest_desc(默认, 按最近高亮时间倒序), latest_asc, "
            "title_asc, title_desc, author_asc, author_desc, count_desc(按批注数降序)"
        ),
    ),
):
    """
    查询书籍列表，支持按书名、作者名模糊搜索，分页，并支持多种排序：
    - latest_desc: 按该书最近一条高亮时间倒序（默认）
    - latest_asc: 按最近一条高亮时间正序
    - title_asc/title_desc: 按书名 A-Z / Z-A
    - author_asc/author_desc: 按作者名 A-Z / Z-A
    - count_desc: 按批注数降序
    返回统一结构: {items: [...], total, skip, limit}
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            params: List[Any] = []
            # 模糊条件之间使用 OR 组合
            fuzzy_conditions: List[str] = []
            if q:
                fuzzy_conditions.append("b.book_title LIKE %s")
                params.append(f"%{q}%")
            if author:
                fuzzy_conditions.append("b.author LIKE %s")
                params.append(f"%{author}%")

            where_clause_parts: List[str] = []
            if fuzzy_conditions:
                where_clause_parts.append("(" + " OR ".join(fuzzy_conditions) + ")")

            where_clause = ""
            if where_clause_parts:
                where_clause = "WHERE " + " AND ".join(where_clause_parts)

            # total: 不受排序影响，只按 books + 模糊条件统计
            count_sql = f"SELECT COUNT(*) AS cnt FROM books b {where_clause}"
            cur.execute(count_sql, params)
            total = cur.fetchone().get("cnt", 0)

            # 统计每本书的批注数量与最近一条高亮时间
            base_sql = """
                FROM books b
                LEFT JOIN (
                    SELECT book_id,
                           COUNT(*)        AS highlight_count,
                           MAX(date_added) AS last_highlight_at
                    FROM highlights
                    GROUP BY book_id
                ) stats ON b.book_id = stats.book_id
            """

            if sort == "latest_desc":
                order_clause = "ORDER BY (stats.last_highlight_at IS NULL), stats.last_highlight_at DESC"
            elif sort == "latest_asc":
                order_clause = "ORDER BY (stats.last_highlight_at IS NULL), stats.last_highlight_at ASC"
            elif sort == "title_asc":
                order_clause = "ORDER BY b.book_title ASC"
            elif sort == "title_desc":
                order_clause = "ORDER BY b.book_title DESC"
            elif sort == "author_asc":
                order_clause = "ORDER BY b.author ASC"
            elif sort == "author_desc":
                order_clause = "ORDER BY b.author DESC"
            elif sort == "count_desc":
                order_clause = "ORDER BY COALESCE(stats.highlight_count,0) DESC, stats.last_highlight_at DESC"
            else:
                order_clause = "ORDER BY (stats.last_highlight_at IS NULL), stats.last_highlight_at DESC"

            sql = (
                "SELECT b.*, COALESCE(stats.highlight_count,0) AS highlight_count, stats.last_highlight_at "
                f"{base_sql} {where_clause} {order_clause} LIMIT %s OFFSET %s"
            )
            page_params = list(params) + [limit, skip]
            cur.execute(sql, page_params)
            rows = cur.fetchall()
    finally:
        conn.close()

    return {"items": rows, "total": total, "skip": skip, "limit": limit}


@app.get("/books/{book_id}")
def get_book_detail(
    book_id: str,
    skip: int = Query(0, ge=0, description="从第几条高亮开始，默认0"),
    limit: int = Query(50, ge=1, le=200, description="返回高亮条数，默认50"),
):
    """
    获取某本书的基本信息以及其高亮（支持分页）。
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM books WHERE book_id=%s", (book_id,))
            book = cur.fetchone()
            if not book:
                raise HTTPException(status_code=404, detail="书籍不存在")

            cur.execute(
                "SELECT COUNT(*) AS cnt FROM highlights WHERE book_id=%s",
                (book_id,),
            )
            total = cur.fetchone().get("cnt", 0)

            cur.execute(
                "SELECT * FROM highlights WHERE book_id=%s ORDER BY clip_index ASC LIMIT %s OFFSET %s",
                (book_id, limit, skip),
            )
            highlights = cur.fetchall()
    finally:
        conn.close()

    return {
        "book": book,
        "highlights": highlights,
        "pagination": {"total": total, "skip": skip, "limit": limit},
    }


@app.get("/books/{book_id}/highlight-count")
def get_book_highlight_count(book_id: str):
    """
    查询指定书籍的高亮数量。
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS cnt FROM highlights WHERE book_id=%s", (book_id,))
            result = cur.fetchone()
    finally:
        conn.close()

    if result is None:
        raise HTTPException(status_code=404, detail="书籍不存在或没有高亮")

    return {"book_id": book_id, "highlight_count": result["cnt"]}


@app.get("/highlights")
def list_highlights(
    book_id: Optional[str] = Query(None, description="按 book_id 过滤"),
    keyword: Optional[str] = Query(None, description="在 highlight_content 中模糊搜索"),
    author: Optional[str] = Query(None, description="按作者名模糊搜索"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    sort: str = Query(
        "date_desc",
        regex="^(date_desc|date_asc|author_asc|author_desc|book_asc|book_desc)$",
        description=(
            "排序方式: date_desc(默认, 按 date_added 倒序), date_asc, "
            "author_asc, author_desc, book_asc, book_desc"
        ),
    ),
):
    """
    查询高亮列表，可按书籍、作者和关键字过滤，分页，并返回书名与作者名。
    返回统一结构: {items: [...], total, skip, limit}
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            conditions: List[str] = []
            params: List[Any] = []
            if book_id:
                conditions.append("h.book_id=%s")
                params.append(book_id)

            # 模糊条件：keyword / author 之间用 OR
            fuzzy_conditions: List[str] = []
            if keyword:
                fuzzy_conditions.append("h.highlight_content LIKE %s")
                params.append(f"%{keyword}%")
            if author:
                fuzzy_conditions.append("b.author LIKE %s")
                params.append(f"%{author}%")

            if fuzzy_conditions:
                conditions.append("(" + " OR ".join(fuzzy_conditions) + ")")

            where_clause = ""
            if conditions:
                where_clause = "WHERE " + " AND ".join(conditions)

            # total
            count_sql = (
                "SELECT COUNT(*) AS cnt "
                "FROM highlights h JOIN books b ON h.book_id = b.book_id "
                f"{where_clause}"
            )
            cur.execute(count_sql, params)
            total = cur.fetchone().get("cnt", 0)

            # 排序
            if sort == "date_desc":
                order_clause = "ORDER BY h.date_added DESC, h.clip_index DESC"
            elif sort == "date_asc":
                order_clause = "ORDER BY h.date_added ASC, h.clip_index ASC"
            elif sort == "author_asc":
                order_clause = "ORDER BY b.author ASC, h.date_added DESC"
            elif sort == "author_desc":
                order_clause = "ORDER BY b.author DESC, h.date_added DESC"
            elif sort == "book_asc":
                order_clause = "ORDER BY b.book_title ASC, h.date_added DESC"
            elif sort == "book_desc":
                order_clause = "ORDER BY b.book_title DESC, h.date_added DESC"
            else:
                order_clause = "ORDER BY h.date_added DESC, h.clip_index DESC"

            sql = (
                "SELECT h.*, b.book_title, b.author "
                "FROM highlights h "
                "JOIN books b ON h.book_id = b.book_id "
                f"{where_clause} "
                f"{order_clause} LIMIT %s OFFSET %s"
            )
            page_params = list(params) + [limit, skip]
            cur.execute(sql, page_params)
            rows = cur.fetchall()
    finally:
        conn.close()

    return {"items": rows, "total": total, "skip": skip, "limit": limit}


@app.put("/books/{book_id}")
def update_book(book_id: str, body: Dict[str, Any]):
    """
    修改书籍信息（书名、作者等）。
    目前支持的字段：book_title, author。
    """
    if not body:
        raise HTTPException(status_code=400, detail="请求体为空")

    allowed_fields = ["book_title", "author"]
    sets = []
    params: List[Any] = []
    for field in allowed_fields:
        if field in body:
            sets.append(f"{field}=%s")
            params.append(body[field])

    if not sets:
        raise HTTPException(status_code=400, detail="没有可更新的字段（仅支持 book_title, author）")

    params.append(book_id)

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            sql = f"UPDATE books SET {', '.join(sets)} WHERE book_id=%s"
            cur.execute(sql, params)
        conn.commit()

        # 返回最新书籍对象
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM books WHERE book_id=%s", (book_id,))
            book = cur.fetchone()
    finally:
        conn.close()

    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在")

    return {"book": book}


@app.post("/highlights")
def create_highlight(body: Dict[str, Any]):
    """
    新增一条 highlight（主要用于手动补录或编辑工具）。
    需要至少提供: id, book_id, highlight_content。
    其他字段可选。
    """
    required = ["id", "book_id", "highlight_content"]
    for k in required:
        if k not in body or not body[k]:
            raise HTTPException(status_code=400, detail=f"缺少必填字段: {k}")

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            sql = """
            INSERT INTO highlights (id, book_id, highlight_content, location, date_added_raw,
                                    date_added, note_content, note_date_added, clip_index)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """
            cur.execute(
                sql,
                (
                    body.get("id"),
                    body.get("book_id"),
                    body.get("highlight_content"),
                    body.get("location"),
                    body.get("date_added_raw"),
                    body.get("date_added"),
                    body.get("note_content"),
                    body.get("note_date_added"),
                    body.get("clip_index"),
                ),
            )
        conn.commit()
    except pymysql.err.IntegrityError as e:
        raise HTTPException(status_code=400, detail=f"插入失败(可能主键重复): {e}")
    finally:
        conn.close()

    return {"status": "ok"}


@app.put("/highlights/{highlight_id}")
def update_highlight(highlight_id: str, body: Dict[str, Any]):
    """
    更新一条 highlight，body 中出现的字段会被更新。
    """
    if not body:
        raise HTTPException(status_code=400, detail="请求体为空")

    allowed_fields = [
        "book_id",
        "highlight_content",
        "location",
        "date_added_raw",
        "date_added",
        "note_content",
        "note_date_added",
        "clip_index",
    ]
    sets = []
    params: List[Any] = []
    for field in allowed_fields:
        if field in body:
            sets.append(f"{field}=%s")
            params.append(body[field])

    if not sets:
        raise HTTPException(status_code=400, detail="没有可更新的字段")

    params.append(highlight_id)

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            sql = f"UPDATE highlights SET {', '.join(sets)} WHERE id=%s"
            cur.execute(sql, params)
        conn.commit()
    finally:
        conn.close()

    return {"status": "ok"}


@app.delete("/highlights/{highlight_id}")
def delete_highlight(highlight_id: str):
    """
    删除一条 highlight。
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM highlights WHERE id=%s", (highlight_id,))
        conn.commit()
    finally:
        conn.close()

    return {"status": "ok"}


@app.get("/stats/overview")
def stats_overview():
    """
    概览统计：
    - 所有 highlights 数量
    - 有标记的书籍数量
    - 活跃天数（有标记的日期数量）
    - 标记最多的前 5 本书
    - 标记最多的前 5 个作者
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # 所有 highlights 数量
            cur.execute("SELECT COUNT(*) AS cnt FROM highlights")
            total_highlights = cur.fetchone()["cnt"]

            # 有标记的书籍数量
            cur.execute("SELECT COUNT(DISTINCT book_id) AS cnt FROM highlights")
            books_with_highlights = cur.fetchone()["cnt"]

            # 活跃天数（以 date_added 为准）
            cur.execute(
                "SELECT COUNT(DISTINCT DATE(date_added)) AS cnt "
                "FROM highlights WHERE date_added IS NOT NULL"
            )
            active_days = cur.fetchone()["cnt"]

            # 标记最多的前 5 本书
            cur.execute(
                """
                SELECT b.book_id, b.book_title, b.author, COUNT(*) AS highlight_count
                FROM highlights h
                JOIN books b ON h.book_id = b.book_id
                GROUP BY b.book_id, b.book_title, b.author
                ORDER BY highlight_count DESC
                LIMIT 5
                """
            )
            top_books = cur.fetchall()

            # 标记最多的前 5 个作者
            cur.execute(
                """
                SELECT b.author, COUNT(*) AS highlight_count
                FROM highlights h
                JOIN books b ON h.book_id = b.book_id
                WHERE b.author IS NOT NULL AND b.author <> ''
                GROUP BY b.author
                ORDER BY highlight_count DESC
                LIMIT 5
                """
            )
            top_authors = cur.fetchall()
    finally:
        conn.close()

    return {
        "total_highlights": total_highlights,
        "books_with_highlights": books_with_highlights,
        "active_days": active_days,
        "top_books": top_books,
        "top_authors": top_authors,
    }


@app.get("/stats/recent")
def stats_recent():
    """
    最近标记数量：
    - 最近 30 天按天统计
    - 最近 12 个月按月份统计
    - 按年份汇总全部历史
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # 最近 30 天（含今天），按日期
            cur.execute(
                """
                SELECT DATE(date_added) AS d, COUNT(*) AS cnt
                FROM highlights
                WHERE date_added IS NOT NULL
                  AND date_added >= CURDATE() - INTERVAL 29 DAY
                GROUP BY DATE(date_added)
                ORDER BY d ASC
                """
            )
            by_day_30 = cur.fetchall()

            # 最近 12 个月，按年月
            cur.execute(
                """
                SELECT DATE_FORMAT(date_added, '%%Y-%%m') AS ym, COUNT(*) AS cnt
                FROM highlights
                WHERE date_added IS NOT NULL
                  AND date_added >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)
                GROUP BY ym
                ORDER BY ym ASC
                """
            )
            by_month_12 = cur.fetchall()

            # 按年份汇总全部
            cur.execute(
                """
                SELECT YEAR(date_added) AS y, COUNT(*) AS cnt
                FROM highlights
                WHERE date_added IS NOT NULL
                GROUP BY YEAR(date_added)
                ORDER BY y ASC
                """
            )
            by_year = cur.fetchall()
    finally:
        conn.close()

    return {
        "by_day_30": by_day_30,
        "by_month_12": by_month_12,
        "by_year": by_year,
    }


@app.get("/stats/authors-wordcloud")
def stats_authors_wordcloud():
    """
    作者名字词云数据：
    按作者名聚合高亮数量，返回 {author, count} 列表，
    前端可根据 count 做词云可视化。
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT b.author AS author, COUNT(*) AS count
                FROM highlights h
                JOIN books b ON h.book_id = b.book_id
                WHERE b.author IS NOT NULL AND b.author <> ''
                GROUP BY b.author
                ORDER BY count DESC
                """
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    return rows


@app.get("/stats/heatmap-year")
def stats_heatmap_year():
    """
    标记热图（最近一年）：
    返回最近 365 天（按 date_added 的日期）每天的高亮数量。
    前端可以据此画日历热图。
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT DATE(date_added) AS d, COUNT(*) AS cnt
                FROM highlights
                WHERE date_added IS NOT NULL
                  AND date_added >= CURDATE() - INTERVAL 365 DAY
                GROUP BY DATE(date_added)
                ORDER BY d ASC
                """
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    return rows


@app.get("/stats/active-days-year")
def stats_active_days_year():
    """
    计算最近一年的 active days（有至少一条高亮的日期数量）。
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT DATE(date_added) AS d, COUNT(*) AS cnt
                FROM highlights
                WHERE date_added IS NOT NULL
                  AND date_added >= CURDATE() - INTERVAL 365 DAY
                GROUP BY DATE(date_added)
                ORDER BY d ASC
                """
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    active_days = len(rows)
    return {"active_days": active_days, "days": rows}


@app.get("/stats/last12months-monthly")
def stats_last_12_months_monthly():
    """
    近十二个月：每个月的标记数量。
    返回形如 [{ "ym": "2025-01", "cnt": 123 }, ...]。
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT DATE_FORMAT(date_added, '%%Y-%%m') AS ym, COUNT(*) AS cnt
                FROM highlights
                WHERE date_added IS NOT NULL
                  AND date_added >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)
                GROUP BY ym
                ORDER BY ym ASC
                """
            )
            by_month_12 = cur.fetchall()
    finally:
        conn.close()

    return by_month_12


@app.get("/stats/title-wordcloud")
def stats_title_wordcloud():
    """
    书名词云数据（全量）：
    按书名聚合高亮数量，返回 [{ "title": "书名", "count": 数量 }, ...]，
    前端可据此做词云。
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT b.book_title AS title, COUNT(*) AS count
                FROM highlights h
                JOIN books b ON h.book_id = b.book_id
                GROUP BY b.book_title
                ORDER BY count DESC
                """
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    return rows


@app.get("/export")
def export_highlights(
    export_format: str = Query("txt", regex="^(txt|json|markdown)$", description="导出格式: txt/json/markdown"),
    split_by_book: bool = Query(False, description="是否按书籍拆分成多个文件（true 则打包为 zip）"),
    lang: str = Query("zh", regex="^(zh|en)$", description="导出语言：zh 或 en，仅影响文本/Markdown 中的标签文案"),
):
    """
    导出高亮/笔记。
    - export_format: txt / json / markdown
    - split_by_book:
        - false: 所有内容导出为一个文件，直接返回
        - true: 按书籍拆分为多个文件，打包为 zip 返回
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    h.*,
                    b.book_title,
                    b.author
                FROM highlights h
                JOIN books b ON h.book_id = b.book_id
                ORDER BY b.book_title ASC, h.clip_index ASC
                """
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    if not rows:
        raise HTTPException(status_code=404, detail="当前没有可导出的高亮数据")

    # 按 book_id 分组
    books: Dict[str, Dict[str, Any]] = {}
    for r in rows:
        bid = r["book_id"]
        if bid not in books:
            books[bid] = {
                "book_id": bid,
                "book_title": r.get("book_title") or "Unknown",
                "author": r.get("author") or "Unknown",
                "items": [],
            }
        books[bid]["items"].append(r)

    def make_txt_content(book: Dict[str, Any], lang_code: str) -> str:
        author_label = "作者" if lang_code == "zh" else "Author"
        lines: List[str] = []
        lines.append(f"{book['book_title']}")
        lines.append(f"{author_label}: {book['author']}")
        lines.append("")
        for item in book["items"]:
            content = item.get("highlight_content") or ""
            if content:
                lines.append(content)
                lines.append("")
            note = item.get("note_content")
            if note:
                lines.append(note)
                lines.append("")
        return "\n".join(lines).strip() + "\n"

    def make_markdown_content(book: Dict[str, Any], lang_code: str) -> str:

        lines: List[str] = []
        lines.append(f"# {book['book_title']}")
        lines.append("")
        lines.append(f"**{book['author']}**")
        lines.append("")
        for index, item in enumerate(book["items"], start=1):
            content = item.get("highlight_content") or ""
            if content:
                lines.append("+ " + content)
                lines.append("")
            note = item.get("note_content")
            if note:
                lines.append("")
                lines.append("\t\t"+note)
                lines.append("")
            if index < len(book["items"]):
                lines.append("")
        return "\n".join(lines).strip() + "\n"

    # 构造导出内容
    if not split_by_book:
        # 单文件：把所有书拼在一起
        if export_format == "json":
            payload = [
                {
                    "book_title": r.get("book_title"),
                    "author": r.get("author"),
                    "highlight_content": r.get("highlight_content"),
                    "note_content": r.get("note_content"),
                    "location": r.get("location"),
                    "date_added_raw": r.get("date_added_raw"),
                    "date_added": r.get("date_added").isoformat() if r.get("date_added") else None,
                    "note_date_added": r.get("note_date_added").isoformat() if r.get("note_date_added") else None,
                }
                for r in rows
            ]
            content_bytes = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
            media_type = "application/json"
            filename = "highlights_all.json"
        else:
            parts: List[str] = []
            for book in books.values():
                if export_format == "txt":
                    parts.append(make_txt_content(book, lang))
                else:
                    parts.append(make_markdown_content(book, lang))
                parts.append("")  # 书与书之间空一行
            text = "\n".join(parts)
            content_bytes = text.encode("utf-8")
            if export_format == "txt":
                media_type = "text/plain; charset=utf-8"
                filename = "highlights_all.txt"
            else:
                media_type = "text/markdown; charset=utf-8"
                filename = "highlights_all.md"

        return StreamingResponse(
            io.BytesIO(content_bytes),
            media_type=media_type,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    # 多文件：按书籍拆分后打包 zip
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for book in books.values():
            title_safe = (book["book_title"] or "unknown").replace("/", "_").replace("\\", "_")
            if export_format == "json":
                payload = [
                    {
                        "book_title": book.get("book_title"),
                        "author": book.get("author"),
                        "highlight_content": item.get("highlight_content"),
                        "note_content": item.get("note_content"),
                        "location": item.get("location"),
                        "date_added_raw": item.get("date_added_raw"),
                        "date_added": item.get("date_added").isoformat() if item.get("date_added") else None,
                        "note_date_added": item.get("note_date_added").isoformat() if item.get("note_date_added") else None,
                    }
                    for item in book["items"]
                ]
                file_bytes = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
                ext = "json"
            elif export_format == "txt":
                file_bytes = make_txt_content(book, lang).encode("utf-8")
                ext = "txt"
            else:
                file_bytes = make_markdown_content(book, lang).encode("utf-8")
                ext = "md"

            zf.writestr(f"{title_safe}.{ext}", file_bytes)

    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="highlights_by_book.zip"'},
    )


