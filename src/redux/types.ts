
export type Charset = 'upper' | 'lower';

export interface Coord2 {
  row: number;
  col: number;
};

export interface Pixel {
  code: number;
  color: number;
};

export interface Font {
  charset: Charset;
  bits: number[];
  charOrder: number[];
};

export interface Framebuf {
  readonly framebuf: Pixel[][];
  readonly width: number;
  readonly height: number;
  readonly backgroundColor: number;
  readonly borderColor: number;
  readonly charset: Charset;
  readonly name?: string;
};

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export type RgbPalette = Rgb[];

// TODO
export type Brush = any;
