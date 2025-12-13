import time
import random
import re
import os
from typing import List, Optional
import requests
from playwright.sync_api import sync_playwright


DEFAULT_CHROME_PATH = r"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"


def _normalize_user_data_dir(path: str) -> str:
    """Normalize user data dir: strip quotes, expand env vars and user (~)."""
    cleaned = path.strip().strip("\"").strip("'")
    cleaned = os.path.expandvars(os.path.expanduser(cleaned))
    return cleaned


def _find_local_chrome_executable() -> Optional[str]:
    """Best-effort locate a locally installed Google Chrome executable on Windows/macOS/Linux."""
    # 1) Explicit override or baked-in default
    env_path = os.environ.get("CHROME_PATH") or os.environ.get("GOOGLE_CHROME_PATH") or DEFAULT_CHROME_PATH
    if env_path and os.path.isfile(env_path):
        return env_path

    # 2) Common install locations
    candidates = []
    if os.name == "nt":
        program_files = os.environ.get("ProgramFiles", r"C:\\Program Files")
        program_files_x86 = os.environ.get("ProgramFiles(x86)", r"C:\\Program Files (x86)")
        local_app_data = os.environ.get("LOCALAPPDATA")
        candidates.extend(
            [
                os.path.join(program_files, "Google", "Chrome", "Application", "chrome.exe"),
                os.path.join(program_files_x86, "Google", "Chrome", "Application", "chrome.exe"),
            ]
        )
        if local_app_data:
            candidates.append(
                os.path.join(local_app_data, "Google", "Chrome", "Application", "chrome.exe")
            )
    else:
        candidates.extend(
            [
                "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                "/usr/bin/google-chrome",
                "/usr/bin/google-chrome-stable",
                "/snap/bin/chromium",
            ]
        )

    for path in candidates:
        if os.path.isfile(path):
            return path
    return None


def _launch_with_local_chrome(p, *, headless: bool, args: List[str]):
    """Prefer system Chrome; fallback to Playwright-managed Chromium."""
    launch_kwargs = {
        "headless": headless,
        "args": args,
    }

    # Prefer Playwright channel (works on most modern Playwright versions)
    try:
        return p.chromium.launch(channel="chrome", **launch_kwargs)
    except TypeError:
        # Older Playwright may not support 'channel'
        pass
    except Exception:
        # Channel supported but not available/failed; fall through
        pass

    chrome_exe = _find_local_chrome_executable()
    if chrome_exe:
        try:
            return p.chromium.launch(executable_path=chrome_exe, **launch_kwargs)
        except Exception:
            pass

    return p.chromium.launch(**launch_kwargs)


def _launch_persistent_with_local_chrome(p, *, user_data_dir: str, headless: bool, args: List[str]):
    """Launch persistent context to reuse existing Chrome profile (keeps login state)."""
    launch_kwargs = {
        "headless": headless,
        "args": args,
    }
    chrome_exe = _find_local_chrome_executable()

    # 1) Prefer explicit executable if we can find one
    if chrome_exe:
        try:
            print(f"➡️ 使用本机 Chrome 可执行文件: {chrome_exe}")
            return p.chromium.launch_persistent_context(
                user_data_dir,
                executable_path=chrome_exe,
                **launch_kwargs,
            )
        except Exception as e:
            print(f"⚠️ 本机 Chrome 启动失败，尝试 channel=chrome: {e}")

    # 2) Try Playwright-managed Chrome channel
    try:
        return p.chromium.launch_persistent_context(
            user_data_dir,
            channel="chrome",
            **launch_kwargs,
        )
    except Exception as e:
        print(f"⚠️ channel=chrome 启动失败，回退到内置 Chromium: {e}")

    # 3) Fallback to bundled Chromium
    return p.chromium.launch_persistent_context(user_data_dir, **launch_kwargs)

def human_sleep(a=0.8, b=1.6):
    time.sleep(random.uniform(a, b))

def search_and_fetch(book_name, author=None, save_image=False, headless=False):
    """
    从豆瓣搜索图书并获取封面URL
    
    Args:
        book_name: 书名
        author: 作者（可选）
        save_image: 是否保存图片到本地
        headless: 是否使用无头模式
    
    Returns:
        dict: 包含 book_url 和 cover_url 的字典，或 None
    """
    query = f"{book_name} {author}".strip() if author else book_name

    with sync_playwright() as p:
        # 如设置 CHROME_USER_DATA_DIR，则用持久化上下文复用登录态
        user_data_dir_raw = os.environ.get("CHROME_USER_DATA_DIR")
        user_data_dir = _normalize_user_data_dir(user_data_dir_raw) if user_data_dir_raw else None
        persistent = bool(user_data_dir)

        args = ["--disable-blink-features=AutomationControlled"]

        if persistent:
            context = _launch_persistent_with_local_chrome(
                p,
                user_data_dir=user_data_dir,
                headless=headless,
                args=args,
            )
            page = context.new_page()
        else:
            browser = _launch_with_local_chrome(
                p,
                headless=headless,
                args=args,
            )

            context = browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                )
            )

            # 反 webdriver
            context.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
            """)

            page = context.new_page()

        try:
            # 1️⃣ 打开搜索页
            search_url = (
                "https://search.douban.com/book/subject_search?"
                f"search_text={query}"
            )
            page.goto(search_url, timeout=60000)
            human_sleep(2, 3)

            # 2️⃣ 模拟滚动
            page.mouse.wheel(0, 600)
            human_sleep()

            # 3️⃣ 点击第一个图书结果
            links = page.query_selector_all('a[href*="/subject/"]')

            book_link = None
            for a in links:
                href = a.get_attribute("href")
                if href and re.search(r"/subject/\d+/", href):
                    book_link = href
                    a.click()
                    break

            if not book_link:
                print(f"❌ 未找到图书：{query}")
                browser.close()
                return None

            human_sleep(2.5, 4)

            # 4️⃣ 获取图书页 URL
            book_page_url = page.url

            # 5️⃣ 抓取封面图片 URL
            img = page.query_selector("#mainpic img")
            cover_url = img.get_attribute("src") if img else None

            print("📘 图书页:", book_page_url)
            print("🖼 封面:", cover_url)

            # 6️⃣ 下载封面（可选）
            if save_image and cover_url:
                try:
                    img_data = requests.get(cover_url, timeout=10).content
                    filename = f"{book_name}.jpg".replace("/", "_")
                    with open(filename, "wb") as f:
                        f.write(img_data)
                    print("✅ 已保存:", filename)
                except Exception as e:
                    print(f"⚠️  图片保存失败: {e}")

            browser.close()

            return {
                "query": query,
                "book_url": book_page_url,
                "cover_url": cover_url
            }

        except Exception as e:
            print(f"❌ 抓取出错: {e}")
            browser.close()
            return None


if __name__ == "__main__":
    result = search_and_fetch("百年孤独", "加西亚·马尔克斯", save_image=False, headless=False)
    if result:
        print("\n✅ 成功:", result)
    else:
        print("\n❌ 失败")
