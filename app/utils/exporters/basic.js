
import { chunkArray } from '../../utils'

let fs = require('fs')

const initCode = ({
  borderColor,
  backgroundColor
}) => `
10 POKE 53280,${borderColor}
20 POKE 53281,${backgroundColor}
30 REM TODO add data listing and loader code
`

function bytesToCommaDelimited(dstLines, bytes, bytesPerLine) {
  let lines = chunkArray(bytes, bytesPerLine)
  for (let i = 0; i < lines.length; i++) {
    const s = `${lines[i].join(',')}`
    dstLines.push(s)
  }
}

function convertToBASIC(lines, fb, idx) {
  const { width, height, framebuf, backgroundColor, borderColor } = fb

  const num = String(idx).padStart(4, '0')

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
  lines.push(`${borderColor},${backgroundColor}`)
  bytesToCommaDelimited(lines, bytes, width)
}

const saveBASIC = (filename, fbs, options) => {
  try {
    let lines = []
    // Single screen export?
    if (options.currentScreenOnly) {
      convertToBASIC(lines, fbs[options.selectedFramebufIndex], 0)
    } else {
      fbs.forEach((fb,idx) => convertToBASIC(lines, fb, idx))
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
    let dataLines = lines.map((line,idx) => {
      return `${idx+100} DATA ${line}`
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
