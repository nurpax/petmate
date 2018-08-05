
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

