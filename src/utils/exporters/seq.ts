
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

function appendCR(bytes:number[], currev:boolean) {
  // Append a Carriage Return if not already done
  if (bytes.length && (bytes[bytes.length -1] & 0x7f) != 0x0d)
    bytes.push(currev ? 0x0d : 0x8d)
}

function convertToSEQ(fb: Framebuf, bytes:number[], insCR:boolean, insClear:boolean, stripBlanks:boolean) {
  const { width, height, framebuf } = fb
  let currcolor = -1
  let currev = false
  let blank_buffer: number[] = [];
  let lastCRrow = -1

  if (insClear) {
    bytes.push(0x93)
  }
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
      if (stripBlanks) {
        // Save blanks into a buffer array
        if (!currev && (byte_char == 0xC0 || byte_char == 0x20)) {
          blank_buffer.push(byte_char);
        } else {
          // If the char is not a blank take all previuos blanks (if any)
          // then print current char
          // If blanks are the lastest chars they are just ignored
          for (let b = 0; b < blank_buffer.length; b++) {
            bytes.push(blank_buffer[b]);
          }
          blank_buffer = []; // reset blank buffer
          bytes.push(byte_char);
        }
      } else {
        bytes.push(byte_char);
      }
    }

    // Check if there are blanks left behind
    // In that case substitute them with a Carriage Return
    if (stripBlanks && blank_buffer.length > 0 && y != lastCRrow) {
      appendCR(bytes, currev);
      lastCRrow = y;
    }
    blank_buffer = []

    if (insCR && (y < height - 1)) {
      appendCR(bytes, currev);
      lastCRrow = y;
    }
  }
}

const  saveSEQ = (filename: string, fb: FramebufWithFont, fmt: FileFormatSeq) => {
  try {
    let bytes:number[] = []
    const {insCR, insClear, stripBlanks} = fmt.exportOptions;
    convertToSEQ(fb, bytes, insCR, insClear, stripBlanks);
    let buf = new Buffer(bytes);
    fs.writeFileSync(filename, buf, null);
  }
  catch(e) {
    alert(`Failed to save file '${filename}'!`);
    console.error(e);
  }
}

export { saveSEQ }