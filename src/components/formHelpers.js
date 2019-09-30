
import React, { Component } from 'react'
import PropTypes from 'prop-types'

import styles from './formHelpers.module.css'

export const CheckboxInput = ({label, onChange, checked}) => {
  return (
    <label className={styles.checkboxContainer}>
      {label}
      <input
        type='checkbox'
        onChange={onChange}
        checked={checked}
      />
      <span className={styles.checkmark}></span>
    </label>
  )
}

const RadioButton_ = ({label, onChange, checked, value}) => {
  return (
    <label className={styles.radioButtonContainer}>
      {label}
      <input
        type='radio'
        value={value}
        onChange={onChange}
        checked={checked}
      />
      <span className={styles.radiocheckmark}></span>
    </label>
  )
}

const NumberInput_ = ({label, onChange, value}) => {
  console.log(value)
  return (
    <label className={styles.numberInputContainer}>
      {label}
      <input
        style={{minWidth: '4em'}}
        type='number'
        value={value}
        size='5'
        min='1'
        max='10000'
        onChange={onChange}
      />
    </label>
  )
}

function setSubStateField(setState, tree) {
  return (field, value) => {
    setState((prevState) => {
      return {
        ...prevState,
        [tree]: {
          ...prevState[tree],
          [field]: value
        }
      }
    })
  }
}

export function connectFormState({state, setState}, subtree) {
  return {
    state: state[subtree],
    setField: setSubStateField(setState, subtree)
  }
}

export class Checkbox extends Component {
  static propTypes = {
    name: PropTypes.string.isRequired
  }

  render () {
    return (
      <FormContext.Consumer>
        {({ setField, state}) => <CheckboxInput checked={state[this.props.name]} onChange={(e) => setField(this.props.name, e.target.checked)} {...this.props} />}
      </FormContext.Consumer>
    )
  }
}

export class RadioButton extends Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired
  }

  render () {
    return (
      <FormContext.Consumer>
        {({ setField, state}) => <RadioButton_ checked={state[this.props.name] === this.props.value} onChange={(e) => setField(this.props.name, e.target.value)} {...this.props} />}
      </FormContext.Consumer>
    )
  }
}

export class NumberInput extends Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired
  }

  render () {
    return (
      <FormContext.Consumer>
        {({ setField, state}) => <NumberInput_ onChange={(e) => setField(this.props.name, e.target.value)} {...this.props} />}
      </FormContext.Consumer>
    )
  }
}

const FormContext = React.createContext('formState')

export class Form extends Component {
  static propTypes = {
    state: PropTypes.object.isRequired,
    setField: PropTypes.func.isRequired,
    children: PropTypes.any.isRequired
  }

  render () {
    return (
      <FormContext.Provider value={{
        setField: this.props.setField,
        state: this.props.state
      }}>
        {this.props.children}
      </FormContext.Provider>
    )
  }
}
