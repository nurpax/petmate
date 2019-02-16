export type Vec3 = [number, number, number];

export interface Matrix3x3 {
  v: [Vec3, Vec3, Vec3];
}

export function c(a: Matrix3x3, col: number): Vec3 {
  return [a.v[0][col], a.v[1][col], a.v[2][col]];
}

export function r(a: Matrix3x3, row: number): Vec3 {
  return [a.v[row][0], a.v[row][1], a.v[row][2]];
}

export function dot(a: Vec3, b: Vec3): number {
  return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
}

export function multVect3(a: Matrix3x3, v: Vec3) {
  return [dot(r(a, 0), v), dot(r(a, 1), v), dot(r(a, 2), v)];
}

export function ident(): Matrix3x3 {
  return {
    v: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ]
  }
}

// Code ported from https://stackoverflow.com/a/18504573
export function invert(a: Matrix3x3) {
  const res = ident();
  function m(r: number, c: number): number {
    return a.v[r][c];
  }
  function setminv(r: number, c: number, v: number): void {
    res.v[r][c] = v;
  }

  // computes the inverse of a matrix m
  const det = m(0, 0) * (m(1, 1) * m(2, 2) - m(2, 1) * m(1, 2)) -
              m(0, 1) * (m(1, 0) * m(2, 2) - m(1, 2) * m(2, 0)) +
              m(0, 2) * (m(1, 0) * m(2, 1) - m(1, 1) * m(2, 0));

  const invdet = 1 / det;

  setminv(0, 0, (m(1, 1) * m(2, 2) - m(2, 1) * m(1, 2)) * invdet);
  setminv(0, 1, (m(0, 2) * m(2, 1) - m(0, 1) * m(2, 2)) * invdet);
  setminv(0, 2, (m(0, 1) * m(1, 2) - m(0, 2) * m(1, 1)) * invdet);
  setminv(1, 0, (m(1, 2) * m(2, 0) - m(1, 0) * m(2, 2)) * invdet);
  setminv(1, 1, (m(0, 0) * m(2, 2) - m(0, 2) * m(2, 0)) * invdet);
  setminv(1, 2, (m(1, 0) * m(0, 2) - m(0, 0) * m(1, 2)) * invdet);
  setminv(2, 0, (m(1, 0) * m(2, 1) - m(2, 0) * m(1, 1)) * invdet);
  setminv(2, 1, (m(2, 0) * m(0, 1) - m(0, 0) * m(2, 1)) * invdet);
  setminv(2, 2, (m(0, 0) * m(1, 1) - m(1, 0) * m(0, 1)) * invdet);
  return res;
}

export function mult(a: Matrix3x3, b: Matrix3x3): Matrix3x3 {
  return {
    v: [
      [dot(r(a,0), c(b,0)),  dot(r(a,0), c(b,1)), dot(r(a,0), c(b,2))],
      [dot(r(a,1), c(b,0)),  dot(r(a,1), c(b,1)), dot(r(a,1), c(b,2))],
      [dot(r(a,2), c(b,0)),  dot(r(a,2), c(b,1)), dot(r(a,2), c(b,2))]
    ]
  }
}

// a c tx
// b d ty
// 0 0 1
// ->
// [a b c d tx ty]
export function toCss(a: Matrix3x3) {
  const v = a.v;
  return `matrix(${v[0][0]}, ${v[1][0]}, ${v[0][1]}, ${v[1][1]}, ${v[0][2]}, ${v[1][2]})`;
}

export function scale(s: number): Matrix3x3 {
  const m = ident();
  m.v[0][0] = s;
  m.v[1][1] = s;
  return m;
}

export function translate(x: number, y: number): Matrix3x3 {
  const m = ident();
  m.v[0][2] = x;
  m.v[1][2] = y;
  return m;
}
