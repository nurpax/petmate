
import React, { Component } from 'react';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import classnames from 'classnames'
import { ActionCreators } from 'redux-undo';

import { Toolbar } from '../redux/toolbar'
import styles from './Toolbar.css';

class Icon extends Component {
  render () {
    return (
      <div className={styles.tooltip}>
        <i
          onClick={this.props.onIconClick}
          className={classnames(styles.icon, `fa ${this.props.iconName} fa-2x`)}
        />
        <span className={styles.tooltiptext}>{this.props.tooltip}</span>
      </div>
    )
  }
}

class ToolbarView extends Component {
  render() {
    return (
      <div className={styles.toolbar}>
        <Icon
          onIconClick={this.props.Toolbar.clearCanvas}
          iconName='fa-trash' tooltip='Clear canvas'/>
        <Icon
          onIconClick={this.props.undo}
          iconName='fa-undo' tooltip='Undo'/>
        <Icon
          onIconClick={this.props.redo}
          iconName='fa-repeat' tooltip='Redo'/>
      </div>
    )
  }
}

const mapDispatchToProps = {
  undo: ActionCreators.undo,
  redo: ActionCreators.redo,
}

const mdtp = dispatch => {
  return {
    ...bindActionCreators(mapDispatchToProps, dispatch),
    Toolbar: Toolbar.bindDispatch(dispatch)
  }
}

const mapStateToProps = state => {
  return {
  }
}
export default connect(
  mapStateToProps,
  mdtp
)(ToolbarView)

