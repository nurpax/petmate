
import { FileFormatSeq, Framebuf, FramebufWithFont } from '../../redux/types'
import { fs } from '../electronImports'

const seq_colors: number[]=[
  0x90, //black
  0x05, //white
  0x1c, //red
  0x9f, //cyan
  0x9c, //purple
  0x1e, //green
  0x1f, //blue
  0x9e, //yellow
  0x81, //orange
  0x95, //brown
  0x96, //pink
  0x97, //grey 1
  0x98, //grey 2
  0x99, //lt green
  0x9a, //lt blue
  0x9b //grey 3
]

function convertToSEQ(fb: Framebuf, bytes:number[], insCR: boolean) {
  const { width, height, framebuf } = fb
  let currcolor = -1
  let currev = false
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let byte_color = framebuf[y][x].color
      if (byte_color != currcolor) {
        bytes.push(seq_colors[byte_color])
        currcolor = byte_color
      }
      let byte_char = framebuf[y][x].code
      if(byte_char>=0x80){
        if (!currev){
          bytes.push(0x12)
          currev = true
        }
        byte_char &= 0x7f
      } else {
        if (currev) {
          bytes.push(0x92)
          currev = false
        }
      }
      if ((byte_char >= 0) && (byte_char <= 0x1f)){
        byte_char = byte_char + 0x40
      }
      else
      {
          if ((byte_char >= 0x40) && (byte_char <= 0x5d))
          {
            byte_char = byte_char + 0x80
          }
          else
          {
              if (byte_char == 0x5e) {
                byte_char = 0xff
              }
              else
              {
                  if (byte_char == 0x95)
                  {
                    byte_char = 0xdf
                  }
                  else
                  {
                      if ((byte_char >= 0x60) && (byte_char <= 0x7f))
                      {
                        byte_char = byte_char + 0x80
                      }
                      else
                      {
                          if ((byte_char >= 0x80) && (byte_char <= 0xbf))
                          {
                            byte_char = byte_char - 0x80
                          }
                          else
                          {
                              if ((byte_char >= 0xc0) && (byte_char <= 0xff))
                              {
                                byte_char = byte_char -0x40
                              }
                          }
                      }
                  }
              }
          }
      }
      bytes.push(byte_char)

    }
    if (insCR && (y < height - 1)) {
      if (currev){
        bytes.push(0x0d)
      } else {
        bytes.push(0x8d)
      }
    }
  }
}

const  saveSEQ = (filename: string, fb: FramebufWithFont, fmt: FileFormatSeq) => {
  try {
    const options = fmt.exportOptions;
    let bytes:number[] = []
    console.log(fmt) // placeholder for future use
    convertToSEQ(fb, bytes, options.insCR)
    let buf = new Buffer(bytes);
    fs.writeFileSync(filename, buf, null);
  }
  catch(e) {
    alert(`Failed to save file '${filename}'!`);
    console.error(e);
  }
}

export { saveSEQ }