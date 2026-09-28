# 将 LXGW WenKai 子集化为「一笔画城」字形字库：GB2312 一级字 + 演示字符 + 符号 → woff2。
# 用法: python tools/subset-font.py
import io
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC_TTF = os.path.join(tempfile.gettempdir(), 'lxgw-wenkai.ttf')
OUT_DIR = os.path.join(ROOT, 'src', 'assets', 'fonts')
OUT_TTF = os.path.join(OUT_DIR, 'ink-glyphs.ttf')
CHARS_TXT = os.path.join(tempfile.gettempdir(), 'ink-glyphs-chars.txt')

# 与 src/lib/glyph/subsetChars.ts 保持一致
EXTRA = '福龍愛沪蓉穗粤镐渝杭苏甯'
SYMBOLS = '♥∞&0123456789ABCXYZ'
chars = []
for zone in range(16, 56):
    for pos in range(1, 95):
        try:
            ch = bytes([0xA0 + zone, 0xA0 + pos]).decode('gb2312')
        except UnicodeDecodeError:
            continue
        if '\u4e00' <= ch <= '\u9fff':
            chars.append(ch)
charset = ''.join(dict.fromkeys(chars + list(EXTRA) + list(SYMBOLS)))

os.makedirs(OUT_DIR, exist_ok=True)
with io.open(CHARS_TXT, 'w', encoding='utf-8', newline='\n') as f:
    f.write(charset)

cmd = [
    sys.executable, '-m', 'fontTools.subset', SRC_TTF,
    f'--text-file={CHARS_TXT}',
    '--layout-features=*',
    f'--output-file={OUT_TTF}',
]
print('charset size:', len(charset))
subprocess.run(cmd, check=True)
size = os.path.getsize(OUT_TTF)
print('ttf bytes:', size)
if size > 5 * 1024 * 1024:
    print('WARN: ttf exceeds 5MB target', file=sys.stderr)
