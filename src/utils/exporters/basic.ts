
import { chunkArray } from '../../utils'

import { fs } from '../electronImports'
import { CHARSET_UPPER } from '../../redux/editor';
import { Framebuf, FileFormatBas } from  '../../redux/types';

interface InitCodeParams {
  borderColor: number;
  backgroundColor: number;
  charsetBits: number;
}

const initCode = ({
  borderColor,
  backgroundColor,
  charsetBits
}: InitCodeParams) => `10 rem created with petmate
20 poke 53280,${borderColor}
30 poke 53281,${backgroundColor}
40 poke 53272,${charsetBits}
100 for i = 1024 to 1024 + 999
110 read a: poke i,a: next i
120 for i = 55296 to 55296 + 999
130 read a: poke i,a: next i
140 goto 140`

function bytesToCommaDelimited(dstLines: string[], bytes: number[]) {
  let lines = chunkArray(bytes, 16)
  for (let i = 0; i < lines.length; i++) {
    const s = `${lines[i].join(',')}`
    dstLines.push(s)
  }
}

function convertToBASIC(lines: string[], fb: Framebuf) {
  const { width, height, framebuf } = fb

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
  bytesToCommaDelimited(lines, bytes)
}

const saveBASIC = (filename: string, fbs: Framebuf[], fmt: FileFormatBas) => {
  const options = fmt.commonExportParams;
  try {
    let lines: string[] = []
    // Single screen export
    const selectedFb = fbs[options.selectedFramebufIndex]
    convertToBASIC(lines, selectedFb)

    let backgroundColor = selectedFb.backgroundColor
    let borderColor = selectedFb.borderColor
    const charsetBits = selectedFb.charset == CHARSET_UPPER ? 0x15 : 0x17;
    const initCodeOptions = {
      backgroundColor,
      borderColor,
      charsetBits
    }
    const init = initCode(initCodeOptions)
    let dataLines = lines.map((line,idx) => {
      return `${idx+200} data ${line}`
    })
    fs.writeFileSync(
      filename,
      init + '\n' + dataLines.join('\n') + '\n', null
    )
  }
  catch(e) {
    alert(`Failed to save file '${filename}'!`)
    console.error(e)
  }
}

export { saveBASIC }
