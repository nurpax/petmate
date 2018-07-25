const fs = require('fs')

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

function screencodeColorMap(charcodes, colors) {
  return charcodes.map((c,i) => {
    return {
      code: c,
      color: colors[i]
    }
  })
}

export const loadCalTxtFramebuf = (filename, importFile) => {
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
    const codes = screencodeColorMap(charcodes, colors)
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

export const loadMarqCFramebuf = (filename, importFile) => {
  try {
    const content = fs.readFileSync(filename, 'utf-8')
    const lines = content.split('\n')

    let mode = undefined
    let frame = undefined
    let bytes = []
    for (let li = 0; li < lines.length; li++) {
      let line = lines[li]
      let m;
      if (m = /unsigned char (.*)\[\].*/.exec(line)) {
        frame = m[1]
        mode = 'bytes'
        continue
      }
      if (m = /};.*/.exec(line)) {
        break
      }
      if (mode === 'bytes') {
        let str = line.trim()
        if (str[str.length-1] == ',') {
          str = str.substring(0, str.length - 1);
        }
        let arr = JSON.parse(`[${str}]`)
        arr.forEach((byte) => {
          bytes.push(byte)
        })
      }
    }

    // TODO support parsing the META tag after the array for machine make,
    // width, height
    const charcodes = bytes.slice(2, 1002)
    const colors = bytes.slice(1002, 2002)
    const codes = screencodeColorMap(charcodes, colors)
    importFile({
      width: 40,
      height: 25,
      backgroundColor: bytes[1],
      borderColor: bytes[0],
      framebuf: chunkArray(codes, 40)
    })

  } catch(e) {
    alert(`Failed to load file '${filename}'!`)
    console.error(e)
  }
}
