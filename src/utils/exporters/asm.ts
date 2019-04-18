
import { chunkArray } from '../../utils'

import { fs } from '../electronImports'
import { CHARSET_UPPER } from '../../redux/editor';
import { Framebuf, FileFormatAsm } from  '../../redux/types';
import * as fp from '../fp'

interface InitCodeParams {
  borderColor: number;
  backgroundColor: number;
  charsetBits: string;
  label: string;
}

interface SyntaxParams {
  byte: string;
  mkLabel: (lbl: string) => string;
  mkLineComment: (text: string) => string;
}

const binaryFormatHelp = [
  'PETSCII memory layout (example for a 40x25 screen)',
  'byte  0         = border color',
  'byte  1         = background color',
  'bytes 2-1001    = screencodes',
  'bytes 1002-2001 = color'
];

const initCodeKickAss = ({
  charsetBits,
  label
}: InitCodeParams) => `
.const PLAY_MUSIC = false

:BasicUpstart2(start)

.var music = null
.if (PLAY_MUSIC) {
.eval music = LoadSid("xxx.sid")
*=music.location "Music"
.fill music.size, music.getData(i)
}

start: {
    lda ${label}
    sta $d020
    lda ${label}+1
    sta $d021
    lda #${charsetBits}
    sta $d018

    // copy PETSCII
    ldx #$00
loop:
    .for(var i=0; i<3; i++) {
        lda ${label}+2+i*$100,x
        sta $0400+i*$100,x
        lda ${label}+2+25*40+i*$100,x
        sta $d800+i*$100,x
    }
    lda ${label}+2+$2e8,x
    sta $0400+$2e8,x
    lda ${label}+2+25*40+$2e8,x
    sta $d800+$2e8,x
    inx
    bne loop

.if (PLAY_MUSIC) {
    ldx #0
    ldy #0
    lda #1 // default song
    jsr music.init
}

infloop:
wait_first_line:
    ldx $d012
    lda $d011
    and #$80
    bne wait_first_line
    cpx #0
    bne wait_first_line

.if (PLAY_MUSIC) {
    jsr music.play
}
    jmp infloop

}
`

const c64tassStartSequence = `
*   = $0801
    .word (+), 2005
    .null $9e, format("%d", start)
+ .word 0

*   = $1000
`

const ACMEStartSequence = `
; acme --cpu 6510 --format cbm --outfile foo.prg foo.asm
* = $0801                             ; BASIC start address (#2049)
!byte $0d,$08,$dc,$07,$9e,$20,$34,$39 ; BASIC loader to start at $c000...
!byte $31,$35,$32,$00,$00,$00         ; puts BASIC line 2012 SYS 49152
* = $c000                             ; start address for 6502 code
`

const initCode64tassOrACME = (startSequence: string) => ({
  borderColor,
  backgroundColor,
  charsetBits,
  label
}: InitCodeParams) => `
${startSequence}
start
    lda #${borderColor}
    sta $d020
    lda #${backgroundColor}
    sta $d021
    lda #${charsetBits}
    sta $d018

    ldx #$00
loop
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

infloop
wait_first_line
    ldx $d012
    lda $d011
    and #$80
    bne wait_first_line
    cpx #0
    bne wait_first_line
    jmp infloop
`

function bytesToCommaDelimited(dstLines: string[], bytes: number[], bytesPerLine: number, byte: string) {
  let lines = chunkArray(bytes, bytesPerLine)
  for (let i = 0; i < lines.length; i++) {
    const s = `${byte} ${lines[i].join(',')}`
    dstLines.push(s)
  }
}

function maybeLabelName(name: string | undefined) {
  return fp.maybeDefault(name, 'untitled' as string);
}

function convertToAsm(lines: string[], fb: Framebuf, {mkLabel, byte}: SyntaxParams) {
  const { width, height, framebuf, backgroundColor, borderColor, name } = fb

  lines.push(mkLabel(maybeLabelName(name)));

  let bytes = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      bytes.push(framebuf[y][x].code)
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      bytes.push(framebuf[y][x].color)
    }
  }
  lines.push(`${byte} ${borderColor},${backgroundColor}`)
  bytesToCommaDelimited(lines, bytes, width, byte)
}

const saveAsm = (filename: string, fbs: Framebuf[], fmt: FileFormatAsm) => {
  const options = fmt.exportOptions;
  let mkInitCode = null
  let syntaxParams: SyntaxParams;
  if (options.assembler === 'kickass') {
    mkInitCode = initCodeKickAss
    syntaxParams = {
      mkLabel: lbl => `${lbl}:`,
      mkLineComment: text => `// ${text}`,
      byte: '.byte'
    }
  } else if (options.assembler === 'c64tass') {
    mkInitCode = initCode64tassOrACME(c64tassStartSequence)
    syntaxParams = {
      mkLabel: lbl => lbl,
      mkLineComment: text => `; ${text}`,
      byte: '.byte'
    }
  } else if (options.assembler === 'acme') {
    mkInitCode = initCode64tassOrACME(ACMEStartSequence)
    syntaxParams = {
      mkLabel: lbl => lbl,
      mkLineComment: text => `; ${text}`,
      byte: '!byte'
    }
  } else {
    alert(`asm output format ${options.assembler} is currently unsupported`)
    return;
  }

  try {
    let lines: string[] = [];
    // Single screen export?
    const selectedFb = fbs[fmt.commonExportParams.selectedFramebufIndex]
    if (fmt.exportOptions.currentScreenOnly) {
      convertToAsm(lines, selectedFb, syntaxParams)
    } else {
      fbs.forEach((fb) => convertToAsm(lines, fb, syntaxParams))
    }
    let backgroundColor = selectedFb.backgroundColor
    let borderColor = selectedFb.borderColor
    const initCodeOptions = {
      backgroundColor,
      borderColor,
      charsetBits: selectedFb.charset === CHARSET_UPPER ? "$15" : "$17",
      label: maybeLabelName(selectedFb.name)
    }
    const init = options.standalone ? mkInitCode(initCodeOptions) : ''
    const formatDocs = binaryFormatHelp.map(syntaxParams.mkLineComment).join('\n');
    fs.writeFileSync(
      filename,
      init + '\n\n' + formatDocs + '\n' + lines.join('\n') + '\n', null
    )
  }
  catch(e) {
    alert(`Failed to save file '${filename}'!`)
    console.error(e)
  }
}

export { saveAsm }
