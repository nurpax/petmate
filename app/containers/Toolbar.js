
import React, { Component } from 'react';
import { connect } from 'react-redux'
import classnames from 'classnames'

import { Toolbar } from '../redux/toolbar'
import styles from './Toolbar.css';

class Icon extends Component {
  render () {
    return (
      <div className={styles.tooltip}>
        <i
          onClick={this.props.onClick}
          className={classnames(styles.icon, `fa ${this.props.iconName} fa-3x`)}
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
          onClick={this.props.Toolbar.clearCanvas}
          iconName='fa-trash' tooltip='Clear canvas'/>
      </div>
    )
  }
}

const mapDispatchToProps = dispatch => {
  return {
    Toolbar: Toolbar.bindDispatch(dispatch)
  }
}

const mapStateToProps = state => {
  return {
  }
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ToolbarView)

