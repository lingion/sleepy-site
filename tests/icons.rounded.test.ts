import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';

// 2026-10-27 定令: 所有方形尖角 Sleepy logo 一律改圆角矩形。
// 品牌几何唯一源 = favicon.svg 底版 rect rx=115/512(iOS AppIcon 比例),位图按同比例圆角。
// 断言取五点采样: 四角透明(圆角生效)+ 中心保留 + 外缘中点(上/左)保留 ——
// 中心与外缘中点同时不透明才能区分「真圆角」与「整图蒙掉/缩小」。

const file = (p: string) => readFileSync(new URL(p, import.meta.url));

async function rgba(buf: Buffer) {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const alphaAt = (x: number, y: number) => data[(y * info.width + x) * info.channels + 3];
  return { w: info.width, h: info.height, alphaAt };
}

function expectRounded(name: string, buf: Buffer) {
  return async () => {
    const { w, h, alphaAt } = await rgba(buf);
    for (const [x, y] of [
      [0, 0],
      [w - 1, 0],
      [0, h - 1],
      [w - 1, h - 1],
    ]) {
      expect(alphaAt(x, y), `${name} 角 (${x},${y}) 应透明`).toBe(0);
    }
    expect(alphaAt(w >> 1, h >> 1), `${name} 中心应不透明`).toBe(255);
    expect(alphaAt(w >> 1, 0), `${name} 上缘中点应不透明`).toBe(255);
    expect(alphaAt(0, h >> 1), `${name} 左缘中点应不透明`).toBe(255);
  };
}

// ICO = 目录头(6 字节)+ 每帧 16 字节目录项 + 帧体(本文件两帧均为 PNG 压缩)。
function icoFrame(buf: Buffer, index: number): Buffer {
  const entry = buf.subarray(6 + index * 16, 22 + index * 16);
  const size = entry.readUInt32LE(8);
  const offset = entry.readUInt32LE(12);
  return buf.subarray(offset, offset + size);
}

describe('品牌位图圆角化(定令 2026-10-27)', () => {
  it('apple-touch-icon.png 四角透明、中心与外缘中点保留', expectRounded('apple-touch-icon', file('../public/apple-touch-icon.png')));
  it('favicon.ico 16 帧四角透明、中心与外缘中点保留', expectRounded('favicon.ico#0', icoFrame(file('../public/favicon.ico'), 0)));
  it('favicon.ico 32 帧四角透明、中心与外缘中点保留', expectRounded('favicon.ico#1', icoFrame(file('../public/favicon.ico'), 1)));
});

describe('品牌 SVG 圆角几何', () => {
  it('favicon.svg 底版 rect 携带 rx=115(尖角底版即回归)', () => {
    const svg = file('../public/favicon.svg').toString('utf8');
    expect(svg).toMatch(/<rect width="512" height="512" rx="115"/);
  });
});
