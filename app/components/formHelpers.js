
import React from 'react'

import styles from './formHelpers.css'

export const Checkbox = ({label, onChange, checked}) => {
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

export const RadioButton = ({label, onChange, checked, value}) => { // = ({label, onChange, checked}) => {
  return (
    <label className={styles.radioButtonContainer}>
      {label}
      <input
        type='radio'
        checked={true}
        value={value}
        onChange={onChange}
        checked={checked}
      />
      <span className={styles.radiocheckmark}></span>
    </label>
  )
}
