
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
