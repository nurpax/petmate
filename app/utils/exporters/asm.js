
import { chunkArray } from '../../utils'

let fs = require('fs')

const initCode = ({
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
        sta $0400+[i*$100],x
        lda frame0000+2+25*40+i*$100,x
        sta $d800+[i*$100],x
    }
    lda frame0000+2+[$2e8],x
    sta $0400+[$2e8],x
    lda frame0000+2+25*40+[$2e8],x
    sta $d800+[$2e8],x
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

function bytesToCommaDelimited(dstLines, bytes, bytesPerLine) {
  let lines = chunkArray(bytes, bytesPerLine)
  for (let i = 0; i < lines.length; i++) {
    const s = `.byte ${lines[i].join(',')}`
    dstLines.push(s)
  }
}

function convertToKickass(lines, fb, idx) {
  const { width, height, framebuf, backgroundColor, borderColor } = fb

  // TODO support multiple screens
  const num = String(idx).padStart(4, '0')
  lines.push(`frame${num}:`)

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
  lines.push(`.byte ${borderColor},${backgroundColor}`)
  bytesToCommaDelimited(lines, bytes, width)
}

const saveKickass = (filename, fbs, options) => {
  try {
    let lines = []
    // Single screen export?
    if (options.currentScreenOnly) {
      convertToKickass(lines, fbs[options.selectedFramebufIndex], 0)
    } else {
      fbs.forEach((fb,idx) => convertToKickass(lines, fb, idx))
    }
    let backgroundColor
    let borderColor
    if (fbs.length >= 1) {
      backgroundColor = fbs[0].backgroundColor
      borderColor = fbs[0].borderColor
    }
    const initCodeOptions = {
      backgroundColor,
      borderColor
    }
    const init = options.standalone ? initCode(initCodeOptions) : ''
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

const saveAsm = (filename, fbs, options) => {
  if (options.assembler === 'kickass') {
    saveKickass(filename, fbs, options)
  } else {
    alert(`asm output format ${options.asm.assembler} is currently unsupported`)
  }
}

export { saveAsm }
