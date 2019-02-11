
import React, { Component, WheelEvent, MouseEvent, PointerEvent } from 'react';
import * as fp from '../utils/fp'
import { colorPalettes } from '../utils/palette'
import { getFontBits } from '../redux/selectors'
import CharGrid from '../components/CharGrid';

import styles from './Zoomable.module.css'

type Vec3 = [number, number, number];

interface Matrix3x3 {
  v: [Vec3, Vec3, Vec3];
}

function c(a: Matrix3x3, col: number): Vec3 {
  return [a.v[0][col], a.v[1][col], a.v[2][col]];
}

function r(a: Matrix3x3, row: number): Vec3 {
  return [a.v[row][0], a.v[row][1], a.v[row][2]];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
}

function multVect3(a: Matrix3x3, v: Vec3) {
  return [dot(r(a, 0), v), dot(r(a, 1), v), dot(r(a, 2), v)];
}

function ident(): Matrix3x3 {
  return {
    v: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ]
  }
}

// Code ported from https://stackoverflow.com/a/18504573
function invert(a: Matrix3x3) {
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

function mult(a: Matrix3x3, b: Matrix3x3): Matrix3x3 {
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
function toCss(a: Matrix3x3) {
  const v = a.v;
  return `matrix(${v[0][0]}, ${v[1][0]}, ${v[0][1]}, ${v[1][1]}, ${v[0][2]}, ${v[1][2]})`;
}

function mkScale(s: number): Matrix3x3 {
  const m = ident();
  m.v[0][0] = s;
  m.v[1][1] = s;
  return m;
}

function mkTranslate(x: number, y: number): Matrix3x3 {
  const m = ident();
  m.v[0][2] = x;
  m.v[1][2] = y;
  return m;
}

interface ZoomableProps {
  containerSize: {width: number, height: number};
}

function Transform(props: { children: any, transform: Matrix3x3 }) {
  const targetMidX = 256;
  const targetMidY = 256;
  const mtx = mult(mkTranslate(targetMidX, targetMidY), props.transform);
  return (
    <div style={{
      transform: toCss(mtx),
      imageRendering: 'pixelated'
    }}>
      {props.children}
    </div>
  )
}

interface ZoomableState {
  transform: Matrix3x3;
}

const srcWidth = 16*8;
const srcHeight = 16*8;

export class Zoomable extends Component<ZoomableProps, ZoomableState> {
  private dragging = false;
  containerDivRef = React.createRef<HTMLDivElement>();

  state: ZoomableState = {
    transform: mult(mkScale(1.0), mkTranslate(-srcWidth/2, -srcHeight/2))
  }

  private fb = fp.mkArray(16, (row => fp.mkArray(16, x => {
    return {code: x + row*16, color: 1}
   })));

  private font = getFontBits('upper');

  handleWheel = (e: WheelEvent) => {
    const scaleDelta = 1 - (e.deltaY / 150.0);

    const bbox = this.containerDivRef.current!.getBoundingClientRect();
    const mouseX = (e.nativeEvent.clientX - bbox.left);
    const mouseY = (e.nativeEvent.clientY - bbox.top);

    this.setState(prevState => {
      // Transform screen [0,w/h] coordinates into char pixel coordinates
      const invXform = invert(prevState.transform);
      const srcPos = multVect3(invXform, [mouseX-256, mouseY-256, 1]);
      return {
        transform:
          mult(
            prevState.transform,
            mult(
              mkTranslate(srcPos[0], srcPos[1]),
              mult(mkScale(scaleDelta),
                mkTranslate(-srcPos[0], -srcPos[1])
              ),
            )
          )
      }
    });
  }

  handlePointerDown = (e: PointerEvent) => {
    this.dragging = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  handlePointerUp = (_e: MouseEvent) => {
    this.dragging = false;
  }

  handlePointerMove = (e: MouseEvent) => {
    if (this.dragging) {
      const dx = e.nativeEvent.movementX;
      const dy = e.nativeEvent.movementY;

      this.setState(prevState => {
        const invXform = invert(prevState.transform);
        const srcDxDy = multVect3(invXform, [dx, dy, 0]);
        return {
          transform:
            mult(
              prevState.transform,
              mkTranslate(srcDxDy[0], srcDxDy[1])
            )
        }
      });

    }
  }

  render () {
    return (
      <div
        className={styles.zoomableContainer} style={{
          backgroundColor: '#579',
          width: '512px',
          height: '512px',
          clipPath: 'polygon(0px 0px, 512px 0px, 512px 512px, 0px 512px)'
        }}
        ref={this.containerDivRef}
        onWheel={this.handleWheel}
        onPointerDown={this.handlePointerDown}
        onPointerUp={this.handlePointerUp}
        onPointerMove={this.handlePointerMove}
      >
        <Transform transform={this.state.transform}>
          <CharGrid
            width={16}
            height={16}
            srcX={0}
            srcY={0}
            charPos={{row: 0, col: 0}}
            textColor={1}
            grid={false}
            colorPalette={colorPalettes['petmate']}
            font={this.font}
            backgroundColor='#555'
            framebuf={this.fb}
          />
        </Transform>
      </div>
    )
  }
}