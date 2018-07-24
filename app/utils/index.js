
const fs = require('fs')
const path = require('path')

// TODO import VICE VPL files

export const palette = [
  {r:0x00, g:0x00, b:0x00},
  {r:0xff, g:0xff, b:0xff},
  {r:146, g:74, b:64},
  {r:132, g:197, b:204},
  {r:147, g:81, b:182},
  {r:114, g:177, b:75},
  {r:72, g:58, b:164},
  {r:213, g:223, b:124},
  {r:153, g:105, b:45},
  {r:103, g:82, b:1},
  {r:192, g:129, b:120},
  {r:96, g:96, b:96},
  {r:138, g:138, b:138},
  {r:178, g:236, b:145},
  {r:134, g:122, b:222},
  {r:174, g:174, b:174},
]

export function rgbToCssRgb(o) {
  return `rgb(${o.r}, ${o.g}, ${o.b}`
}

export function colorIndexToCssRgb(idx) {
  return rgbToCssRgb(palette[idx])
}

const charOrder = [ 32, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 46, 44, 59, 33, 63, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 34, 35, 36, 37, 38, 39, 112, 110, 108, 123, 85, 73, 79, 80, 113, 114, 40, 41, 60, 62, 78, 77, 109, 125, 124, 126, 74, 75, 76, 122, 107, 115, 27, 29, 31, 30, 95, 105, 100, 111, 121, 98, 120, 119, 99, 116, 101, 117, 97, 118, 103, 106, 91, 43, 82, 70, 64, 45, 67, 68, 69, 84, 71, 66, 93, 72, 89, 47, 86, 42, 61, 58, 28, 0, 127, 104, 92, 102, 81, 87, 65, 83, 88, 90, 94, 96, 160, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 174, 172, 187, 161, 191, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 162, 163, 164, 165, 166, 167, 240, 238, 236, 251, 213, 201, 207, 208, 241, 242, 168, 169, 188, 190, 206, 205, 237, 253, 252, 254, 202, 203, 204, 250, 235, 243, 155, 157, 159, 158, 223, 233, 228, 239, 249, 226, 248, 247, 227, 244, 229, 245, 225, 246, 231, 234, 219, 171, 210, 198, 192, 173, 195, 196, 197, 212, 199, 194, 221, 200, 217, 175, 214, 170, 189, 186, 156, 128, 255, 232, 220, 230, 209, 215, 193, 211, 216, 218, 222, 224 ]

export const charScreencodeFromRowCol = ({row, col}) => {
  const idx = row*16 + col
  return charOrder[idx]
}

const FILE_VERSION = 1

export const saveFramebuf = (filename, framebuf) => {
  const content = JSON.stringify({
    version: FILE_VERSION,
    width: framebuf.width,
    height: framebuf.height,
    backgroundColor: framebuf.backgroundColor,
    borderColor: framebuf.borderColor,
    framebuf: framebuf.framebuf
  })
  try {
    fs.writeFileSync(filename, content, 'utf-8');
  }
  catch(e) {
    alert(`Failed to save file '${filename}'!`)
  }
}

const loadJsonFramebuf = (filename, importFile) => {
  try {
    const content = fs.readFileSync(filename, 'utf-8')
    const c = JSON.parse(content)
    console.log(c)
    if (c.version === 1) {
      importFile({
        width: c.width,
        height: c.height,
        backgroundColor: c.backgroundColor,
        borderColor: c.borderColor,
        framebuf: c.framebuf
      })
    } else {
      alert(`Unknown file format version ${c.version}!`)
    }
  }
  catch(e) {
    alert(`Failed to load file '${filename}'!`)
  }
}

/**
 * Returns an array with arrays of the given size.
 *
 * @param myArray {Array} array to split
 * @param chunk_size {Integer} Size of every group
 */
function chunkArray(myArray, chunk_size){
    var index = 0;
    var arrayLength = myArray.length;
    var tempArray = [];

    for (index = 0; index < arrayLength; index += chunk_size) {
        const myChunk = myArray.slice(index, index+chunk_size);
        // Do something if you want with the group
        tempArray.push(myChunk);
    }

    return tempArray;
}

const loadCalTxtFramebuf = (filename, importFile) => {
  try {
    const content = fs.readFileSync(filename, 'utf-8')
    const lines = content.split('\n')

    let mode = undefined
    let charcodes = []
    let colors = []
    lines.forEach(line => {
      if (line.match(/Character data/)) {
        mode = 'char'
        return
      }
      if (line.match(/Colour data/)) {
        mode = 'color'
        return
      }
      var m;
      if (m = /BYTE (.*)/.exec(line)) {
        let arr = JSON.parse(`[${m[1]}]`)
        arr.forEach(c => {
          if (mode === 'char') {
            charcodes.push(c)
          } else if (mode === 'color') {
            colors.push(c)
          } else {
            console.error('invalid mode')
          }
        })
      }
    })
    console.log('CHARCODES', charcodes.length)
    console.log('COLORS', colors.length)
    const codes = charcodes.map((c,i) => {
      return {
        code: c,
        color: colors[i]
      }
    })
    importFile({
      width: 40,
      height: 25,
      backgroundColor: 0,
      borderColor: 0,
      framebuf: chunkArray(codes, 40)
    })
  }
  catch(e) {
    alert(`Failed to load file '${filename}'!`)
  }
}

export const loadFramebuf = (filename, importFile) => {
  const ext = path.extname(filename)
  if (ext === '.petski') {
    return loadJsonFramebuf(filename, importFile)
  }  else if (ext === '.txt') {
    return loadCalTxtFramebuf(filename, importFile)
  }
}

export const sortRegion = ({min, max}) => {
  const minx = Math.min(min.col, max.col)
  const miny = Math.min(min.row, max.row)
  const maxx = Math.max(min.col, max.col)
  const maxy = Math.max(min.row, max.row)
  return {
    min: {row: miny, col: minx},
    max: {row: maxy, col: maxx},
  }
}

const electron = require('electron')
const isDev = require('electron-is-dev');

export const loadAppFile = (filename) => {
  const appPath = electron.remote.app.getAppPath()
  let abspath = isDev ?
    path.resolve(__dirname, filename) :
    path.resolve(appPath, filename)
  return fs.readFileSync(abspath)
}
