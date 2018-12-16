
interface FileFormatBase {
  name: string;
  ext: string;
  commonExportParams: {
    selectedFramebufIndex: number;
  };
  exportOptions?: {};
}

export interface FileFormatAsm extends FileFormatBase {
  ext: 'asm';
  exportOptions: {
    currentScreenOnly: boolean;
    standalone: boolean;
    assembler: 'acme' | 'c64tass' | 'kickass';
  };
}

export interface FileFormatGif extends FileFormatBase {
  ext: 'gif';
  exportOptions: {
    delayMS: string;
    animMode: 'single' | 'anim';
    loopMode: 'once' | 'loop' | 'pingpong';
    borders: boolean;
  };
}

export interface FileFormatPng extends FileFormatBase {
  ext: 'png';
  exportOptions: {
    doublePixels: boolean;
    alphaPixel: boolean;
    borders: boolean;
  };
}

export interface FileFormatC extends FileFormatBase {
  ext: 'c';
}

export interface FileFormatPrg extends FileFormatBase {
  ext: 'prg';
}

export interface FileFormatBas extends FileFormatBase {
  ext: 'bas';
  exportOptions: {
    currentScreenOnly: boolean;
    standalone: boolean;
  };
}

export type FileFormat =
    FileFormatAsm
  | FileFormatGif
  | FileFormatPng
  | FileFormatC
  | FileFormatPrg
  | FileFormatBas
