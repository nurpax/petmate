
import * as workspace from './workspace'
import {
  loadCalTxtFramebuf,
  loadMarqCFramebuf
 } from './importers'
import {
  savePNG,
  saveMarqC,
  saveExecutablePRG,
  saveAsm,
  saveBASIC
} from './exporters'
import {
  drawLine
} from './line'

import { colorPalettes } from './palette'

const fs = require('fs')
const path = require('path')

// TODO import VICE VPL files

export const formats = {
  png: {
    name: 'PNG .png',
    ext: 'png'
  },
  c: {
    name: 'PETSCII .c',
    ext: 'c'
  },
  prg: {
    name: 'Executable .prg',
    ext: 'prg'
  },
  asm: {
    name: 'Assembler source .asm',
    ext: 'asm'
  },
  basic: {
    name: 'BASIC listing .bas',
    ext: 'bas'
  }
}

export function rgbToCssRgb(o) {
  return `rgb(${o.r}, ${o.g}, ${o.b}`
}

export function colorIndexToCssRgb(palette, idx) {
  return rgbToCssRgb(palette[idx])
}

const charOrder = [ 32, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 46, 44, 59, 33, 63, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 34, 35, 36, 37, 38, 39, 112, 110, 108, 123, 85, 73, 79, 80, 113, 114, 40, 41, 60, 62, 78, 77, 109, 125, 124, 126, 74, 75, 76, 122, 107, 115, 27, 29, 31, 30, 95, 105, 100, 111, 121, 98, 120, 119, 99, 116, 101, 117, 97, 118, 103, 106, 91, 43, 82, 70, 64, 45, 67, 68, 69, 84, 71, 66, 93, 72, 89, 47, 86, 42, 61, 58, 28, 0, 127, 104, 92, 102, 81, 87, 65, 83, 88, 90, 94, 96, 160, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 174, 172, 187, 161, 191, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 162, 163, 164, 165, 166, 167, 240, 238, 236, 251, 213, 201, 207, 208, 241, 242, 168, 169, 188, 190, 206, 205, 237, 253, 252, 254, 202, 203, 204, 250, 235, 243, 155, 157, 159, 158, 223, 233, 228, 239, 249, 226, 248, 247, 227, 244, 229, 245, 225, 246, 231, 234, 219, 171, 210, 198, 192, 173, 195, 196, 197, 212, 199, 194, 221, 200, 217, 175, 214, 170, 189, 186, 156, 128, 255, 232, 220, 230, 209, 215, 193, 211, 216, 218, 222, 224 ]

export const charScreencodeFromRowCol = ({row, col}) => {
  const idx = row*16 + col
  return charOrder[idx]
}

export const rowColFromScreencode = (code) => {
  for (let i = 0; i < charOrder.length; i++) {
    if (charOrder[i] === code) {
      return {
        row: Math.floor(i >> 4),
        col: Math.floor(i & 15)
      }
    }
  }
  console.error('impossible')
  return null
}

const FILE_VERSION = 1

const framebufFields = (framebuf) => {
  return {
    width: framebuf.width,
    height: framebuf.height,
    backgroundColor: framebuf.backgroundColor,
    borderColor: framebuf.borderColor,
    framebuf: framebuf.framebuf
  }
}

export const saveFramebufs = (filename, framebufs, palette, options) => {
  const { selectedFramebufIndex } = options
  const selectedFramebuf = framebufs[selectedFramebufIndex]
  const ext = path.extname(filename)
  if (ext === '.png') {
    return savePNG(filename, selectedFramebuf, palette, options)
  } else if (ext === '.c') {
    return saveMarqC(filename, framebufs, options)
  } else if (ext === '.asm') {
    return saveAsm(filename, framebufs, options)
  } else if (ext === '.prg') {
    return saveExecutablePRG(filename, selectedFramebuf, options)
  } else if (ext === '.bas') {
    return saveBASIC(filename, framebufs, options)
  } else {
    alert(`Unsupported export format ${ext}!`)
  }
}

const WORKSPACE_VERSION = 1
export const saveWorkspace = (filename, screens, getFramebufById) => {
  const content = JSON.stringify({
    version: WORKSPACE_VERSION,
    // Renumber screen indices to 0,1,2,..,N and drop unused framebufs
    screens: screens.map((dummy,idx )=> idx),
    framebufs: screens.map(fbid => {
      return {
        ...framebufFields(getFramebufById(fbid))
      }
    })
  })
  try {
    fs.writeFileSync(filename, content, 'utf-8');
  }
  catch(e) {
    alert(`Failed to save file '${filename}'!`)
  }
}

export const loadWorkspace = (filename, dispatch) => {
  const ext = path.extname(filename)
  try {
    const content = fs.readFileSync(filename, 'utf-8')
    const c = JSON.parse(content)
    workspace.load(dispatch, c)
  }
  catch(e) {
    console.error(e)
    alert(`Failed to load workspace '${filename}'!`)
  }
}

const loadJsonFramebuf = (filename, importFile) => {
  try {
    const content = fs.readFileSync(filename, 'utf-8')
    const c = JSON.parse(content)
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

export const loadFramebuf = (filename, importFile) => {
  const ext = path.extname(filename)
  if (ext === '.petski') {
    return loadJsonFramebuf(filename, importFile)
  }  else if (ext === '.txt') {
    return loadCalTxtFramebuf(filename, importFile)
  }  else if (ext === '.c') {
    return loadMarqCFramebuf(filename, importFile)
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

/**
 * Returns an array with arrays of the given size.
 *
 * @param myArray {Array} array to split
 * @param chunk_size {Integer} Size of every group
 */
export function chunkArray(myArray, chunk_size){
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


const electron = require('electron')
const { ipcRenderer } = electron
const isDev = require('electron-is-dev');

export const loadAppFile = (filename) => {
  const appPath = electron.remote.app.getAppPath()
  let abspath = isDev ?
    path.resolve(__dirname, filename) :
    path.resolve(appPath, filename)
  return fs.readFileSync(abspath)
}

export const systemFontData = loadAppFile('./assets/system-charset.bin')
export const executablePrgTemplate = loadAppFile('./assets/template.prg')

function setWorkspaceFilenameWithTitle(setWorkspaceFilename, filename) {
  setWorkspaceFilename(filename)
  ipcRenderer.send('set-title', `Petmate - ${filename}`)
}

export function dialogLoadWorkspace(dispatch, setWorkspaceFilename) {
  const {dialog} = require('electron').remote
  const filters = [
    {name: 'Petmate workspace', extensions: ['petmate']},
  ]
  const filename = dialog.showOpenDialog({properties: ['openFile'], filters})
  if (filename === undefined) {
    return
  }
  if (filename.length === 1) {
    loadWorkspace(filename[0], dispatch)
    setWorkspaceFilenameWithTitle(setWorkspaceFilename, filename[0])
  } else {
    console.error('wtf?!')
  }
}

export function dialogSaveAsWorkspace(dispatch, screens, getFramebufByIndex, setWorkspaceFilename) {
  const {dialog} = require('electron').remote
  const filters = [
    {name: 'Petmate workspace file', extensions: ['petmate']},
  ]
  const filename = dialog.showSaveDialog({properties: ['openFile'], filters})
  if (filename === undefined) {
    return
  }
  saveWorkspace(filename, screens, getFramebufByIndex)
  setWorkspaceFilenameWithTitle(setWorkspaceFilename, filename)
}

export function dialogExportFile(type, framebufs, palette, options) {
  const {dialog} = require('electron').remote
  const filters = [
    {name: type.name, extensions: [type.ext]}
  ]
  const filename = dialog.showSaveDialog({properties: ['openFile'], filters})
  if (filename === undefined) {
    return
  }
  saveFramebufs(filename, framebufs, palette, options)
}

export function dialogImportFile(type, importFile) {
  const {dialog} = require('electron').remote
  const filters = [
    { name: type.name, extensions: [type.ext] }
  ]
  const filename = dialog.showOpenDialog({properties: ['openFile'], filters})
  if (filename === undefined) {
    return
  }
  if (filename.length === 1) {
    loadFramebuf(filename[0], importFile)
  } else {
    console.error('wtf?!')
  }
}

export function loadSettings(dispatchSettingsLoad) {
  const electron = require('electron')
  const path = require('path')
  let settingsFile = path.join(electron.remote.app.getPath('userData'), 'Settings')
  var fs = require('fs');
  if (fs.existsSync(settingsFile)) {
    const c = fs.readFileSync(settingsFile, 'utf-8')
    const j = JSON.parse(c)
    console.log(settingsFile, j)
    dispatchSettingsLoad(j)
  }
}

const importFramebufs = workspace.importFramebufs

export { drawLine, colorPalettes, importFramebufs }
