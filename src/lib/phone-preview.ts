// 1206 × 2622 device pixels at a 3× device scale. Only uniform scaling is allowed.
export const phoneViewport = { width: 402, height: 874 } as const;
export const phoneScale = (width: number) => Math.max(0, width) / phoneViewport.width;
