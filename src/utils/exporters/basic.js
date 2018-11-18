
import { chunkArray } from '../../utils'

let fs = require('fs')

const initCode = ({
  borderColor,
  backgroundColor
}) => `10 rem created with petmate
20 poke 53280,${borderColor}
30 poke 53281,${backgroundColor}
100 for i = 1024 to 1024 + 999
110 read a: poke i,a: next i
120 for i = 55296 to 55296 + 999
130 read a: poke i,a: next i
140 goto 140`

function bytesToCommaDelimited(dstLines, bytes, bytesPerLine) {
  let lines = chunkArray(bytes, 16)
  for (let i = 0; i < lines.length; i++) {
    const s = `${lines[i].join(',')}`
    dstLines.push(s)
  }
}

function convertToBASIC(lines, fb, idx) {
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
  bytesToCommaDelimited(lines, bytes, width)
}

const saveBASIC = (filename, fbs, options) => {
  try {
    let lines = []
    // Single screen export
    const selectedFb = fbs[options.selectedFramebufIndex]
    convertToBASIC(lines, selectedFb, 0)

    let backgroundColor = selectedFb.backgroundColor
    let borderColor = selectedFb.borderColor
    const initCodeOptions = {
      backgroundColor,
      borderColor
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
