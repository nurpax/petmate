import { fs } from '../electronImports';
import { framebufFromJson } from '../../redux/workspace';
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_BORDER_COLOR } from '../../redux/editor';
import { Pixel } from '../../redux/types';

class SeqDecoder {
  revsOn = false;
  c64Screen: Pixel[][] = [];
  cursorPosX: number = 0;
  cursorPosY: number = 0;
  cursorColor: number = 0;
  width: number = 40;
  height: number = 25;

  constructor() {
    this.cls();
  }

  chrout(c: number) {
    switch (c) {
      case 0x05:
        this.cursorColor = 0x01;
        break;
      case 0x07:
        //Probably doesn't apply here: Play bell?
        break;
      case 0x0d:
        this.carriageReturn();
        break;
      case 0x8d:
        this.carriageReturn();
        break;
      case 0x0e:
        //Probably doesn't apply here: Set_Lowercase();
        break;
      case 0x11:
        this.cursorDown();
        break;
      case 0x12:
        this.revsOn = true;
        break;
      case 0x13:
        this.cursorPosX = 0;
        this.cursorPosY = 0;
        break;
      case 0x14:
        this.del();
        break;
      case 0x1c:
        this.cursorColor = 0x02; //Red
        break;
      case 0x1d:
        this.cursorRight();
        break;
      case 0x1e:
        this.cursorColor = 0x05; //Green
        break;
      case 0x1f:
        this.cursorColor = 0x06; //Blue
        break;
      case 0x81:
        this.cursorColor = 0x08; //Orange
        break;
      case 0x8e:
        //Probably doesn't apply here: Set_Uppercase();
        break;
      case 0x90:
        this.cursorColor = 0x00; //Black
        break;
      case 0x91:
        this.cursorUp();
        break;
      case 0x92:
        this.revsOn = false;
        break;
      case 0x93:
        this.cls();
        break;
      case 0x95:
        this.cursorColor = 0x09; //Brown
        break;
      case 0x96:
        this.cursorColor = 0x0a; //Pink
        break;
      case 0x97:
        this.cursorColor = 0x0b; //Grey1
        break;
      case 0x98:
        this.cursorColor = 0x0c; //Grey2
        break;
      case 0x99:
        this.cursorColor = 0x0d; //Lt Green
        break;
      case 0x9a:
        this.cursorColor = 0x0e; //Lt Blue
        break;
      case 0x9b:
        this.cursorColor = 0x0f; //Grey3
        break;
      case 0x9c:
        this.cursorColor = 0x04; //Purple
        break;
      case 0x9d:
        this.cursorLeft();
        break;
      case 0x9e:
        this.cursorColor = 0x07; //Yellow
        break;
      case 0x9f:
        this.cursorColor = 0x03; //Cyan
        break;
      case 0xff:
        this.scrnOut(94);
        break;
      default:
        if ((c >= 0x20) && (c < 0x40)) this.scrnOut(c);
        if ((c >= 0x40) && (c <= 0x5f)) this.scrnOut((c - 0x40));
        if ((c >= 0x60) && (c <= 0x7f)) this.scrnOut((c - 0x20));
        if ((c >= 0xa0) && (c <= 0xbf)) this.scrnOut((c - 0x40));
        if ((c >= 0xc0) && (c <= 0xfe)) this.scrnOut((c - 0x80));
        break;
    }
  }

  cls() {
    for (let y = 0; y < this.height; y++) {
      this.c64Screen[y] = []
      for (let x = 0; x < this.width; x++) {
        this.c64Screen[y][x] = { code: 0x20, color: DEFAULT_BACKGROUND_COLOR };
      }
    }
  }

  carriageReturn() {
    this.cursorDown();
    this.revsOn = false;
    this.cursorPosX = 0;
  }

  del() {
    this.cursorLeft();
    this.scrnOut(0x20);
    this.cursorLeft();
  }

  scrnOut(b: number) {
    var c = b;
    if (this.revsOn) c += 0x80;
    this.c64Screen[this.cursorPosY][this.cursorPosX] = { code: c, color: this.cursorColor };
    this.cursorRight();
  }
  cursorRight() {
    if (this.cursorPosX < this.width - 1) {
      this.cursorPosX++;
    }
    else {
      if (this.cursorPosY < this.height - 1) {
        this.cursorPosY++;
        this.cursorPosX = 0;
      }
      else {
        this.scrollAllUp();
        this.cursorPosX = 0;
        this.cursorPosY = this.height - 1;
      }
    }
  }
  cursorUp() {
    if (this.cursorPosY > 0) this.cursorPosY--;
  }

  cursorDown() {
    if (this.cursorPosY < this.height - 1) {
      this.cursorPosY++;
    }
    else {
      this.scrollAllUp();
    }
  }

  cursorLeft() {
    if (this.cursorPosX > 0) {
      this.cursorPosX--;
    }
    else {
      if (this.cursorPosY > 0) {
        this.cursorPosX = this.width - 1;
        this.cursorPosY--;
      }
    }
  }

  scrollAllUp() {
    for (let y = 1; y < this.height; y++) {
      this.c64Screen[y - 1] = this.c64Screen[y];
    }
  }

  decode(seqFile: any) {
    this.cls();
    for (let i = 0; i < seqFile.length; i++) {
      this.chrout(seqFile[i]);
    }
  }

}

export function loadSeq(filename: string) {
  try {
    const seqFile = fs.readFileSync(filename)
    const decoder = new SeqDecoder();
    decoder.decode(seqFile);
    var framebuffer = framebufFromJson({
      width: 40,
      height: 25,
      backgroundColor: DEFAULT_BACKGROUND_COLOR,
      borderColor: DEFAULT_BORDER_COLOR,
      framebuf: decoder.c64Screen

    })
    return framebuffer
  } catch (e) {
    alert(`Failed to load file '${filename}'!`)
    console.error(e)
    return undefined;
  }
}