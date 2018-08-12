
import { chunkArray } from '../../utils'

let fs = require('fs')

const initCodeKickAss = ({
  borderColor,
  backgroundColor
}) => `
.const PLAY_MUSIC = false

:BasicUpstart2(start)

.var music = null
.if (PLAY_MUSIC) {
.eval music = LoadSid("xxx.sid")
*=music.location "Music"
.fill music.size, music.getData(i)
}

start: {
    lda #${borderColor}
    sta $d020
    lda #${backgroundColor}
    sta $d021

    // copy PETSCII
    ldx #$00
loop:
    .for(var i=0; i<3; i++) {
        lda frame0000+2+i*$100,x
        sta $0400+i*$100,x
        lda frame0000+2+25*40+i*$100,x
        sta $d800+i*$100,x
    }
    lda frame0000+2+$2e8,x
    sta $0400+$2e8,x
    lda frame0000+2+25*40+$2e8,x
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
* = $0801                             ; BASIC start address (#2049)
!byte $0d,$08,$dc,$07,$9e,$20,$34,$39 ; BASIC loader to start at $c000...
!byte $31,$35,$32,$00,$00,$00         ; puts BASIC line 2012 SYS 49152
* = $c000                             ; start address for 6502 code
`

const initCode64tassOrACME = startSequence => ({
  borderColor,
  backgroundColor
}) => `
${startSequence}
start
    lda #${borderColor}
    sta $d020
    lda #${backgroundColor}
    sta $d021

    ldx #$00
loop
    lda frame0000+2+0*$100,x
    sta $0400+0*$100,x
    lda frame0000+2+25*40+0*$100,x
    sta $d800+0*$100,x

    lda frame0000+2+1*$100,x
    sta $0400+1*$100,x
    lda frame0000+2+25*40+1*$100,x
    sta $d800+1*$100,x

    lda frame0000+2+2*$100,x
    sta $0400+2*$100,x
    lda frame0000+2+25*40+2*$100,x
    sta $d800+2*$100,x

    lda frame0000+2+$2e8,x
    sta $0400+$2e8,x
    lda frame0000+2+25*40+$2e8,x
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

function bytesToCommaDelimited(dstLines, bytes, bytesPerLine, byte) {
  let lines = chunkArray(bytes, bytesPerLine)
  for (let i = 0; i < lines.length; i++) {
    const s = `${byte} ${lines[i].join(',')}`
    dstLines.push(s)
  }
}

function convertToAsm(lines, fb, idx, {mkLabel, byte}) {
  const { width, height, framebuf, backgroundColor, borderColor } = fb

  const num = String(idx).padStart(4, '0')
  lines.push(mkLabel(`frame${num}`))

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

const saveAsm = (filename, fbs, options) => {
  let mkInitCode = null
  let syntaxParams = null
  if (options.assembler === 'kickass') {
    mkInitCode = initCodeKickAss
    syntaxParams = {
      mkLabel: lbl => `${lbl}:`,
      byte: '.byte'
    }
  } else if (options.assembler === 'c64tass') {
    mkInitCode = initCode64tassOrACME(c64tassStartSequence)
    syntaxParams = {
      mkLabel: lbl => lbl,
      byte: '.byte'
    }
  } else if (options.assembler === 'acme') {
    mkInitCode = initCode64tassOrACME(ACMEStartSequence)
    syntaxParams = {
      mkLabel: lbl => lbl,
      byte: '!byte'
    }
  }

  if (mkInitCode === null) {
    alert(`asm output format ${options.assembler} is currently unsupported`)
  }

  try {
    let lines = []
    // Single screen export?
    const selectedFb = fbs[options.selectedFramebufIndex]
    if (options.currentScreenOnly) {
      convertToAsm(lines, selectedFb, 0, syntaxParams)
    } else {
      fbs.forEach((fb,idx) => convertToAsm(lines, fb, idx, syntaxParams))
    }
    let backgroundColor = selectedFb.backgroundColor
    let borderColor = selectedFb.borderColor
    const initCodeOptions = {
      backgroundColor,
      borderColor
    }
    const init = options.standalone ? mkInitCode(initCodeOptions) : ''
    fs.writeFileSync(
      filename,
      init + '\n' + lines.join('\n') + '\n', null
    )
  }
  catch(e) {
    alert(`Failed to save file '${filename}'!`)
    console.error(e)
  }
}

export { saveAsm }
