
import React, { Component } from 'react';
import ReactCursorPosition from 'react-cursor-position'
import { Coord2 } from '../redux/types';

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
type Subtract<T, K> = Omit<T, keyof K>;

export type DragStartFunc = (charPos: Coord2) => void;
export type DragMoveFunc = (charPos: Coord2) => void;
export type DragEndFunc   = () => void;
export type AltClickFunc  = (charPos: Coord2) => void;

type Position = {
  position: { x: number, y: number };
  elementDimensions: { width: number, height: number };
}

type IsActive = { isActive: boolean };
interface CharPositionProps {
  onActivationChanged(args: IsActive): void;
  onCharPosChanged: (pos: Coord2|null) => void;
}

export class CharPosition extends Component<CharPositionProps> {

  prevCharPos: Coord2|null = null;

  constructor (props: CharPositionProps) {
    super(props)
    this.prevCharPos = null
  }

  toCharPos = ({position, elementDimensions}: Position): Coord2|null => {
    if (elementDimensions === null) {
      return null
    }
    const { x, y } = position
    const { width, height } = elementDimensions
    const col = Math.floor(x / width * 16)
    const row = Math.floor(y / height * 16)
    return { row, col }
  }

  // The parent component needs to know if the cursor is active (inside the
  // child div) to conditionally render sibling components like cursor pos,
  // char under cursor, etc.
  handleActivationChanged = ({isActive}: {isActive: boolean})  => {
    this.props.onActivationChanged({isActive})
  }

  // The parent component needs to know what the current charpos is inside the
  // child div).
  handlePositionChanged = (vals: Position)  => {
    if (vals.elementDimensions === undefined) {
      return
    }
    const { row, col } = this.toCharPos(vals)!
    if (this.prevCharPos === null ||
      row !== this.prevCharPos.row ||
      col !== this.prevCharPos.col) {
      this.props.onCharPosChanged(this.toCharPos(vals))
      this.prevCharPos = { row, col }
    }
  }

  render () {
    return (
      <ReactCursorPosition
        onActivationChanged={this.handleActivationChanged}
        onPositionChanged={this.handlePositionChanged}
        shouldDecorateChildren={false}
      >
        {this.props.children}
      </ReactCursorPosition>
    )
  }
}

// The component wrapped by withMouseCharPositionShiftLockAxis must
// have these props in its component type.
interface WithMouseCharPosWrappeeProps {
  charPos: Coord2|null;
  onMouseDown: (e: any, dragStart: DragStartFunc, altClick: AltClickFunc) => void;
  onMouseMove: (e: any, dragMove: DragMoveFunc) => void;
  onMouseUp:   (e: any, dragEnd: DragEndFunc) => void;
}

interface WithMouseCharPositionShiftLockAxisProps {
  altKey: boolean;
  shiftKey: boolean;
  isActive: boolean;
  onCharPosChange: (args:{
    isActive: boolean;
    charPos: Coord2
  }) => void;
}

interface CursorPositionProps {
  containerSize: { width: number, height: number};
  onActivationChanged(args: IsActive): void;
}

interface ToCharRowColProps extends Position {
  framebufWidth: number;
  framebufHeight: number;
}

export const withMouseCharPositionShiftLockAxis = <P extends WithMouseCharPosWrappeeProps>(C: React.ComponentType<P>) => {
  class ToCharRowCol extends Component<any> {

    prevCharPos:    Coord2|null = null;
    prevCoord:      Coord2|null = null;
    lockStartCoord: Coord2|null = null;
    lockedCharPos:  Coord2|null = null;
    shiftLockAxis:  'shift'|'row'|'col'|null = null;
    dragging = false;

    constructor (props: P & CursorPositionProps & WithMouseCharPositionShiftLockAxisProps & ToCharRowColProps) {
      super(props);

      this.prevCharPos = null;
      this.dragging = false;
      this.prevCoord = null;
      this.lockStartCoord = null;
      this.lockedCharPos = null;
      this.shiftLockAxis = null;
    }

    currentCharPos = () => {
      const {
        position,
        elementDimensions,
        framebufWidth,
        framebufHeight
      } = this.props
      const { width, height } = elementDimensions
      return {
        col: Math.floor(position.x / width * framebufWidth),
        row: Math.floor(position.y / height * framebufHeight)
      }
    }

    handleMouseDown = (e: any, dragStart: DragStartFunc, altClick: AltClickFunc) => {
      const charPos = this.currentCharPos()
      // alt-left click doesn't start dragging
      if (this.props.altKey) {
        this.dragging = false;
        altClick(charPos);
        return;
      }

      this.dragging = true
      e.target.setPointerCapture(e.pointerId);
      this.prevCoord = charPos
      dragStart(charPos)

      const lock = this.props.shiftKey
      this.shiftLockAxis = lock ? 'shift' : null
      if (lock) {
        this.lockStartCoord = {
          ...charPos
        }
      }
    }

    handleMouseUp = (_e: React.PointerEvent, dragEnd: DragEndFunc) => {
      if (this.dragging) {
        dragEnd()
      }

      this.dragging = false
      this.lockStartCoord = null
      this.shiftLockAxis = null
    }

    handleMouseMove = (_e:any, dragMove: DragMoveFunc) => {
      const charPos = this.currentCharPos()

      if (this.prevCharPos === null ||
        this.prevCharPos.row !== charPos.row ||
        this.prevCharPos.col !== charPos.col) {
        this.prevCharPos = {...charPos}
        this.props.onCharPosChange({isActive:this.props.isActive, charPos})
      }

      if (!this.dragging) {
        return
      }

      // Note: prevCoord is known to be not null here as it's been set
      // in mouse down
      const coord = charPos;
      if (this.prevCoord!.row !== coord.row || this.prevCoord!.col !== coord.col) {

        if (this.shiftLockAxis === 'shift') {
          if (this.prevCoord!.row === coord.row) {
            this.shiftLockAxis = 'row'
          } else if (this.prevCoord!.col === coord.col) {
            this.shiftLockAxis = 'col'
          }
        }

        if (this.shiftLockAxis !== null) {
          let lockedCharPos = {
            ...this.lockStartCoord!
          }

          if (this.shiftLockAxis === 'row') {
            lockedCharPos.col = charPos.col
          } else if (this.shiftLockAxis === 'col') {
            lockedCharPos.row = charPos.row
          }
          this.lockedCharPos = lockedCharPos
          dragMove(lockedCharPos)
        } else {
          dragMove(charPos)
        }
        this.prevCoord = charPos
      }
    }

    render () {
      const { framebufWidth, framebufHeight } = this.props
      const { position, elementDimensions, ...props } = this.props
      const { width, height } = elementDimensions
      const col = Math.floor(this.props.position.x / width * framebufWidth)
      const row = Math.floor(this.props.position.y / height * framebufHeight)
      const locked = this.shiftLockAxis === 'row' || this.shiftLockAxis === 'col'
      const charPos = locked ? this.lockedCharPos : {row, col}
      // See hover fade HOC, this could be made to work better.  But this whole
      // HOC is such a mess anyway that it's not worth spending time fixing
      // this.
      const tsWorkaround: any = {
        charPos,
        onMouseDown: this.handleMouseDown,
        onMouseUp: this.handleMouseUp,
        onMouseMove: this.handleMouseMove
      };
      return (
        <C
          {...tsWorkaround}
          {...props}
        />
      )
    }
  }
  return class extends Component<P & WithMouseCharPositionShiftLockAxisProps & CursorPositionProps & ToCharRowColProps> {
    render () {
      return (
        <ReactCursorPosition
          style={{
            ...this.props.containerSize
          }}
          onActivationChanged={this.props.onActivationChanged}>
          <ToCharRowCol {...this.props} />
        </ReactCursorPosition>
      )
    }
  }
}

interface WithHoverInjectedProps {
  onToggleActive: () => void;
  fadeOut: boolean;
}

interface WithHoverFadeProps {
  pickerId: any;
  active: boolean;
  containerClassName: string;
  onSetActive: (pickerId: any, active: boolean) => void;
}

interface WithHoverFadeState {
  fadeOut: boolean;
}

// See https://medium.com/@jrwebdev/react-higher-order-component-patterns-in-typescript-42278f7590fb
export const withHoverFade = <P extends WithHoverInjectedProps>(C: React.ComponentType<P>) => {
  return class extends Component<Subtract<P, WithHoverInjectedProps> & WithHoverFadeProps, WithHoverFadeState> {
    state: WithHoverFadeState = {
      fadeOut: false
    };
    timerId: any = null;

    componentWillUnmount () {
      if (this.timerId !== null) {
        clearTimeout(this.timerId)
      }
    }

    clearHoverTimer = () => {
      if (this.timerId !== null) {
        clearTimeout(this.timerId)
        this.timerId = null
      }
    }

    handleMouseEnter = () => {
      this.setState({fadeOut: false})
      this.clearHoverTimer()
    }

    handleMouseLeave = () => {
      clearTimeout(this.timerId)
      this.setState({fadeOut: true})
      this.timerId = setTimeout(() => {
        this.props.onSetActive(this.props.pickerId, false)
      }, 500)
    }

    handleToggleActive = () => {
      const newIsActive = !this.props.active
      this.props.onSetActive(this.props.pickerId, newIsActive)
      if (this.timerId !== null) {
        this.clearHoverTimer()
      }
    }

    render () {
//      const { pickerId, active, containerClassName, onSetActive, ...rest} = this.props as WithHoverFadeProps;
      // See: https://github.com/Microsoft/TypeScript/issues/28938
      const ts32workAround: any = {
        ...this.props,
        onToggleActive: this.handleToggleActive,
        fadeOut: this.state.fadeOut
      }
/*
          <C
            {...rest}
            onToggleActive={this.handleToggleActive}
            fadeOut={this.state.fadeOut}
          />
*/
      return (
        <div
          className={this.props.containerClassName}
          onMouseLeave={this.handleMouseLeave}
          onMouseEnter={this.handleMouseEnter}
        >
          <C
            {...ts32workAround}
          />
        </div>
      )
    }
  }
}

