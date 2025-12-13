import json
import os
import sys
import time
import random
import re
from pathlib import Path
import requests
from t1 import search_and_fetch, human_sleep

def save_cover_image(cover_url, book_id, cover_dir="covers"):
    """
    保存封面图片到本地，返回相对路径
    
    Args:
        cover_url: 封面图片URL
        book_id: 书籍ID（用作文件名）
        cover_dir: 保存目录
    
    Returns:
        str: 相对路径，例如 "covers/book_123.jpg"，失败返回 None
    """
    if not cover_url:
        return None

    try:
        # 创建保存目录
        os.makedirs(cover_dir, exist_ok=True)

        # 从URL获取图片扩展名，默认jpg
        ext = "jpg"
        try:
            # 尝试从URL路径获取扩展名
            url_path = cover_url.split("?")[0]  # 移除查询参数
            if "." in url_path:
                ext = url_path.split(".")[-1].lower()
                if ext not in ["jpg", "jpeg", "png", "gif", "webp"]:
                    ext = "jpg"
        except:
            pass

        # 保存文件
        filename = f"book_{book_id}.{ext}"
        filepath = os.path.join(cover_dir, filename)

        response = requests.get(cover_url, timeout=10)
        response.raise_for_status()

        with open(filepath, "wb") as f:
            f.write(response.content)

        # 返回相对路径（使用正斜杠兼容）
        relative_path = f"{cover_dir}/{filename}".replace("\\", "/")
        print(f"   💾 已保存: {relative_path}")
        return relative_path

    except Exception as e:
        print(f"   ⚠️  图片保存失败: {str(e)}")
        return None


def process_backup(backup_file="klip-backup.json", output_file=None, cover_dir="covers"):
    """
    处理备份文件，为每本书获取豆瓣封面URL和图片，并写回备份文件
    
    Args:
        backup_file: 输入的备份文件路径
        output_file: 输出的备份文件路径（默认同输入）
        cover_dir: 保存封面图片的目录
    """
    if output_file is None:
        output_file = backup_file

    # 读取备份文件
    print(f"📖 读取备份文件: {backup_file}")
    with open(backup_file, "r", encoding="utf-8") as f:
        backup_data = json.load(f)

    books = backup_data.get("books", {})
    print(f"📚 找到 {len(books)} 本书")
    print(f"📁 封面保存目录: {cover_dir}")

    # 统计需要更新的书
    books_without_cover = [
        (bid, book) for bid, book in books.items()
        if not book.get("cover_url") or book.get("cover_url").strip() == ""
    ]
    print(f"🔍 需要获取封面的书: {len(books_without_cover)} 本")

    if not books_without_cover:
        print("✅ 所有书籍都已有封面URL，无需处理")
        return

    # 处理每本书
    processed = 0
    failed = 0

    for idx, (book_id, book) in enumerate(books_without_cover, 1):
        book_title = book.get("book_title", "Unknown")
        author = book.get("author", "")

        print(f"\n[{idx}/{len(books_without_cover)}] 处理: {book_title} - {author}")

        try:
            result = search_and_fetch(book_title, author, save_image=False, headless=False)

            if result and result.get("cover_url"):
                cover_url = result["cover_url"]
                print(f"   🖼 获取到URL: {cover_url[:50]}...")

                # 保存图片并获取相对路径
                relative_path = save_cover_image(cover_url, book_id, cover_dir)

                if relative_path:
                    # 保存相对路径而不是原始URL
                    books[book_id]["cover_url"] = relative_path
                    print(f"   ✅ 成功")
                    processed += 1
                else:
                    print(f"   ⚠️  图片保存失败")
                    failed += 1
            else:
                print(f"   ⚠️  未获取到URL")
                break
                failed += 1

            # 随机等待，避免请求过快
            if idx < len(books_without_cover):
                sleep_time = random.uniform(3, 8)
                print(f"   ⏳ 等待 {sleep_time:.1f}s...")
                time.sleep(sleep_time)

        except Exception as e:
            print(f"   ❌ 错误: {str(e)}")
            failed += 1
            # 出错后也要等待
            if idx < len(books_without_cover):
                time.sleep(random.uniform(2, 5))

    # 保存更新后的备份文件
    print(f"\n💾 保存备份文件: {output_file}")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(backup_data, f, ensure_ascii=False, indent=2)

    print(f"\n📊 处理完成:")
    print(f"   ✅ 成功: {processed}")
    print(f"   ❌ 失败: {failed}")
    print(f"   📚 总计: {len(books)}")
    print(f"   📁 封面保存在: {os.path.abspath(cover_dir)}")


if __name__ == "__main__":
    backup_file = "klip-backup.json"

    # 支持命令行参数
    if len(sys.argv) > 1:
        backup_file = sys.argv[1]

    if not os.path.exists(backup_file):
        print(f"❌ 文件不存在: {backup_file}")
        sys.exit(1)

    try:
        process_backup(backup_file)
        print("\n✨ 所有操作完成！")
    except KeyboardInterrupt:
        print("\n⚠️  用户中断")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ 致命错误: {str(e)}")
        sys.exit(1)
