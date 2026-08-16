declare module 'gifenc' {
  export function GIFEncoder(opts?: any): {
    writeFrame: (index: any, width: number, height: number, opts?: any) => void;
    finish: () => void;
    bytes: () => Uint8Array;
    bytesView: () => Uint8Array;
  };
  export function quantize(data: Uint8ClampedArray | Uint8Array, maxColors?: number, format?: string): number[][];
  export function applyPalette(data: Uint8ClampedArray | Uint8Array, palette: number[][], format?: string): Uint8Array;
}
