declare module "gifenc" {
  export type Palette = number[][];
  export function quantize(data: Uint8ClampedArray, colors: number, options?: { format?: string; oneBitAlpha?: boolean }): Palette;
  export function applyPalette(data: Uint8ClampedArray, palette: Palette, format?: string): Uint8Array;
  export function GIFEncoder(): { writeFrame(index: Uint8Array, width: number, height: number, options: { palette: Palette; repeat?: number; transparent?: boolean }): void; finish(): void; bytes(): Uint8Array; };
}
