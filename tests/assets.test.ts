import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// T4v4 资产尺寸闸(spec C3/C4 + §8):
// widget 十图 = 2026-10-22 验收通过的 renderer 直出尺寸;
// 手机三图 = 预裁无效区(状态栏 y0-112 + 导航键 y2160-2340)后的 1080×2048,
// raw 备份必须存在(不可逆操作留痕)。裁线下界经目检实测(01-week app 底导航标签止 y2155)。

const read = (p: string) => readFileSync(new URL(`../src/assets/screenshots/${p}`, import.meta.url));
const size = (p: string): [number, number] => {
  const b = read(p);
  if (!(b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47)) {
    throw new Error(`${p}: 非 PNG`);
  }
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};

describe('widget 资产 = 验收尺寸(spec §8-1)', () => {
  const expected: Record<string, [number, number]> = {
    'widget-weekgrid': [825, 1375],
    'widget-today': [825, 343],
    'widget-twodays': [825, 343],
    'widget-weeklist': [825, 343],
    'widget-weekview': [825, 550],
  };
  for (const [name, dims] of Object.entries(expected)) {
    for (const theme of ['light', 'dark'] as const) {
      it(`${name}-${theme} = ${dims[0]}×${dims[1]}`, () => {
        expect(size(`${name}-${theme}.png`)).toEqual(dims);
      });
    }
  }
});

describe('手机三图预裁 = 安全带 + raw 备份(spec C3/§8-2)', () => {
  for (const name of ['01-week', '20-import', '22-reminder']) {
    for (const theme of ['light', 'dark'] as const) {
      it(`${name}-${theme} 裁后 1080×2048 且 raw 1080×2340 在档`, () => {
        expect(size(`${name}-${theme}.png`)).toEqual([1080, 2048]);
        const rawP = new URL(`../src/assets/screenshots/${name}-${theme}-raw.png`, import.meta.url);
        expect(existsSync(rawP), `raw 备份缺失: ${name}-${theme}-raw.png`).toBe(true);
        const rb = readFileSync(rawP);
        expect([rb.readUInt32BE(16), rb.readUInt32BE(20)]).toEqual([1080, 2340]);
      });
    }
  }
});
