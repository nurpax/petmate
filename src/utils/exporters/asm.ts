
import { chunkArray } from '../../utils'

import { fs } from '../electronImports'
import { CHARSET_UPPER, CHARSET_LOWER } from '../../redux/editor';
import { FileFormatAsm, FramebufWithFont } from  '../../redux/types';
import * as fp from '../fp'

interface InitCodeParams {
  borderColor: number;
  backgroundColor: number;
  charsetBits: string;
  label: string;
}

const syntaxes: { [index: string]: { cli: string, comment: string, byte: string, label: string } } = {
  'kickass': {
    cli: '; java -jar KickAss.jar foo.asm -o foo.prg',
    comment: '//',
    byte: '.byte',
    label: ':'
  },
  'acme': {
    cli: '; acme --cpu 6510 --format cbm --outfile foo.prg foo.asm',
    comment: ';',
    byte: '!byte',
    label: ' '
  },
  'c64tass': {
    cli: '; 64tass -C -a --cbm-prg foo.asm -o foo.prg',
    comment: ';',
    byte: '.byte',
    label: ' '
  },
  'c64jasm': {
    cli: '; c64jasm foo.asm --out foo.prg',
    comment: ';',
    byte: '!byte',
    label: ':'
  },
  'ca65': {
    cli: '',
    comment: ';',
    byte: '.byte',
    label: ':'
  },
};

const binaryFormatHelp = `
; PETSCII memory layout (example for a 40x25 screen)'
; byte  0         = border color'
; byte  1         = background color'
; bytes 2-1001    = screencodes'
; bytes 1002-2001 = color
`;

// Written in
const initCode = ({
  charsetBits,
  label
}: InitCodeParams) => `
* = $0801          ; BASIC start address (#2049)
!byte $0C, $08, $00, $00, $9E, $32, $30, $36
!byte $31, $00, $00, $00

start:
    lda ${label}
    sta $d020
    lda ${label}+1
    sta $d021
    lda #${charsetBits}
    sta $d018

    ldx #$00
loop:
    lda ${label}+2+0*$100,x
    sta $0400+0*$100,x
    lda ${label}+2+25*40+0*$100,x
    sta $d800+0*$100,x

    lda ${label}+2+1*$100,x
    sta $0400+1*$100,x
    lda ${label}+2+25*40+1*$100,x
    sta $d800+1*$100,x

    lda ${label}+2+2*$100,x
    sta $0400+2*$100,x
    lda ${label}+2+25*40+2*$100,x
    sta $d800+2*$100,x

    lda ${label}+2+$2e8,x
    sta $0400+$2e8,x
    lda ${label}+2+25*40+$2e8,x
    sta $d800+$2e8,x
    inx
    bne loop

    jmp *
`;

function toHex8(v: number): string {
  return `${v.toString(16).toUpperCase().padStart(2, '0')}`
}

function bytesToCommaDelimited(dstLines: string[], bytes: number[], bytesPerLine: number, hex: boolean) {
  let lines = chunkArray(bytes, bytesPerLine)
  for (let i = 0; i < lines.length; i++) {
    const nums = lines[i].map(n => hex ? `$${toHex8(n)}` : `${n}`);
    dstLines.push(`!byte ${nums.join(',')}`);
  }
}

function maybeLabelName(name: string | undefined) {
  return fp.maybeDefault(name, 'untitled' as string);
}

function convertToAsm(lines: string[], fb: FramebufWithFont, hex: boolean) {
  const { width, height, framebuf, backgroundColor, borderColor, name } = fb;

  lines.push(`${maybeLabelName(name)}:`);

  let bytes = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      bytes.push(framebuf[y][x].code);
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      bytes.push(framebuf[y][x].color);
    }
  }
  lines.push(`!byte ${borderColor},${backgroundColor}`);
  bytesToCommaDelimited(lines, bytes, width, hex);

  // Save font bits
  if (fb.charset !== CHARSET_UPPER && fb.charset !== CHARSET_LOWER) {
    lines.push('', `* = $3000`);
    lines.push(`${maybeLabelName(name)}_font:`);
    bytesToCommaDelimited(lines, fb.font.bits, 16, hex);
  }
}

function convertSyntax(asm: string, syntax: typeof syntaxes['c64jasm']) {
  function convertLine(line: string) {
    let m;
    if (m = /^!byte (.*)/.exec(line)) {
      return `${syntax.byte} ${m[1]}`;
    }
    if (m = /^([^;]*); (.*)/.exec(line)) {
      return `${m[1]}${syntax.comment} ${m[2]}`;
    }
    if (m = /^([a-zA-Z_]+[a-zA-Z_0-9]*):(.*)/.exec(line)) {
      return `${m[1]}${syntax.label}${m[2]}`;
    }
    return line;
  }
  const lines = asm.split('\n');
  return lines.map(convertLine).join('\n');
}

export function genAsm(fbs: FramebufWithFont[], fmt: FileFormatAsm) {
  const options = fmt.exportOptions;
  let lines: string[] = [];
  // Single screen export?
  const hexOutput = fmt.exportOptions.hex;
  const selectedFb = fbs[fmt.commonExportParams.selectedFramebufIndex];
  if (fmt.exportOptions.currentScreenOnly) {
    convertToAsm(lines, selectedFb, hexOutput);
  } else {
    fbs.forEach((fb) => convertToAsm(lines, fb, hexOutput));
  }
  let backgroundColor = selectedFb.backgroundColor;
  let borderColor = selectedFb.borderColor;
  const label = maybeLabelName(selectedFb.name);
  let charsetBits;
  switch(selectedFb.charset) {
    case 'upper': charsetBits = "$15"; break;
    case 'lower': charsetBits = "$17"; break;
    default:      charsetBits = `%00010000 | ((${label}_font/2048)*2)`; break;
  }
  const syntax = syntaxes[fmt.exportOptions.assembler];
  const init = options.standalone ? `${syntax.cli}\n${initCode({ backgroundColor, borderColor, charsetBits, label })}` : '';
  return convertSyntax(init + '\n' + binaryFormatHelp + '\n' + lines.join('\n') + '\n', syntax);
}

const saveAsm = (filename: string, fbs: FramebufWithFont[], fmt: FileFormatAsm) => {
  try {
    const src = genAsm(fbs, fmt);
    fs.writeFileSync(filename, src, null);
  } catch(e) {
    alert(`Failed to save file '${filename}'!`);
    console.error(e);
  }
}

export { saveAsm }
