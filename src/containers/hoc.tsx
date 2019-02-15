
import React, { Component } from 'react';

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
type Subtract<T, K> = Omit<T, keyof K>;

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

