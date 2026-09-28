# 生成 GB2312 一级汉字区（16-55 区）字符常量文件。
# GB2312 区位码: byte1 = 0xA0 + 区, byte2 = 0xA0 + 位；一级汉字位于区 16-55。
import io
import json

chars = []
for zone in range(16, 56):
    for pos in range(1, 95):
        try:
            ch = bytes([0xA0 + zone, 0xA0 + pos]).decode('gb2312')
        except UnicodeDecodeError:
            continue
        if '\u4e00' <= ch <= '\u9fff':
            chars.append(ch)

unique = ''.join(dict.fromkeys(chars))
out = (
    '// 本文件由 tools/gen-charset.py 自动生成，请勿手改。\n'
    f'// 来源: GB2312 一级汉字区(区16-55)，共 {len(unique)} 字。\n'
    f'export const GB2312_LEVEL1 = {json.dumps(unique, ensure_ascii=False)}\n'
)
with io.open('src/lib/glyph/gb2312Level1.ts', 'w', encoding='utf-8', newline='\n') as f:
    f.write(out)
print('chars:', len(unique))
