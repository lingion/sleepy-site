#!/usr/bin/env -S python3 -I
"""手机三图无效区预裁(spec C3/§8-2):裁状态栏 y0-112 + 导航键 y2100-2340,保留安全带 112-2100。
不可逆操作留痕:原图先 cp 为 *-raw.png(已存在则不动,幂等)。逐张目检参数,禁盲批改动此默认值。"""
import sys
from pathlib import Path
from PIL import Image

SRC = Path(__file__).resolve().parent.parent / "src" / "assets" / "screenshots"
TOP, BOT = 112, 2160  # 目检修正: 01-week app底导航标签止y2155,系统键起y2250;统一2160保单比例  实测方差普查: y0-112=11.1(状态栏), y112-140=0.0(空带), 原估 2100 系导航键起点;目检实测 app底导航标签至 y2155

targets = ["01-week-light", "01-week-dark", "20-import-light", "20-import-dark", "22-reminder-light", "22-reminder-dark"]
if len(sys.argv) > 1:
    targets = [t for t in targets if any(a in t for a in sys.argv[1:])]

for name in targets:
    p = SRC / f"{name}.png"
    raw = SRC / f"{name}-raw.png"
    if not raw.exists():
        Image.open(p).save(raw)
        print(f"backup {raw.name}")
    im = Image.open(raw)
    assert im.size == (1080, 2340), f"{raw.name} 非 1080x2340: {im.size}"
    im.crop((0, TOP, 1080, BOT)).save(p)
    print(f"crop {p.name} -> 1080x{BOT-TOP}")
