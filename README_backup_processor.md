#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
备份文件处理脚本 - 获取豆瓣图书封面URL

功能：
- 读取 klip-backup.json 备份文件
- 为每本书在豆瓣搜索并获取封面URL
- 将结果写回备份文件

使用方法：
1. 确保安装依赖：
    pip install -r requirements.txt

    说明：脚本会优先使用你本机安装的 Google Chrome（Playwright `channel=chrome`）。
    - 如果你希望强制指定 Chrome 路径，可设置环境变量 `CHROME_PATH` 指向 chrome.exe。
    - 如果本机 Chrome 不可用，才会回退到 Playwright 自带的 Chromium；此时需要执行：
      playwright install chromium

2. 运行脚本：
   python process_backup.py [备份文件名]
   
   例如：
   python process_backup.py klip-backup.json
   python process_backup.py my-backup.json

3. 脚本会自动：
   - 检查每本书是否已有 cover_url
   - 跳过已有URL的书籍
   - 逐本搜索并获取封面
   - 自动保存进度到备份文件

注意事项：
- 建议在运行前备份原始 JSON 文件
- 脚本会自动为每次请求添加随机延迟，避免被豆瓣限制
- 若搜索失败，会标记为失败但不会停止处理其他书籍
- 中断脚本时可随时重新运行，它会继续处理未完成的书籍

配置选项（修改代码）：
- headless=False: 使用有头模式（显示浏览器窗口）
- headless=True:  使用无头模式（后台运行）
- sleep_time: 调整请求间隔时间

示例输出：
📖 读取备份文件: klip-backup.json
📚 找到 120 本书
🔍 需要获取封面的书: 85 本

[1/85] 处理: 百年孤独 - 加西亚·马尔克斯
📘 图书页: https://book.douban.com/subject/xxxx/
🖼 封面: https://pic.doubanio.com/...
✅ 成功: https://pic.doubanio.com/...
⏳ 等待 5.2s...

[2/85] 处理: 活着 - 余华
...

📊 处理完成:
   ✅ 成功: 82
   ❌ 失败: 3
   📚 总计: 120

✨ 所有操作完成！
"""

if __name__ == "__main__":
    from process_backup import process_backup
    import sys
    import os

    backup_file = "klip-backup.json"
    if len(sys.argv) > 1:
        backup_file = sys.argv[1]

    if not os.path.exists(backup_file):
        print(f"❌ 文件不存在: {backup_file}")
        sys.exit(1)

    print(__doc__)
    print("\n" + "="*60)
    print("开始处理备份文件...")
    print("="*60)

    try:
        process_backup(backup_file)
    except KeyboardInterrupt:
        print("\n⚠️  用户中断")
    except Exception as e:
        print(f"\n❌ 错误: {e}")
