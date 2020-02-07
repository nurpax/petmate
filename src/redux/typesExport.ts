
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
    hex: boolean;
    assembler: 'acme' | 'c64tass' | 'ca65' | 'c64jasm' | 'kickass';
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
    alphaPixel: boolean;
    borders: boolean;
    scale: number;
  };
}

export interface FileFormatC extends FileFormatBase {
  ext: 'c';
}

export interface FileFormatSeq extends FileFormatBase {
  ext: 'seq';
  exportOptions: {
    insCR: boolean;
    insClear: boolean;
    stripBlanks: boolean;
  }
}


export interface FileFormatD64 extends FileFormatBase {
  ext: 'd64';
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

export interface FileFormatJson extends FileFormatBase {
  ext: 'json';
  exportOptions: {
    currentScreenOnly: boolean;
  };
}

export type FileFormat =
    FileFormatAsm
  | FileFormatD64
  | FileFormatGif
  | FileFormatPng
  | FileFormatC
  | FileFormatPrg
  | FileFormatBas
  | FileFormatJson
  | FileFormatSeq
