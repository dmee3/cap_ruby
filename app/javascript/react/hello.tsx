import React from 'react'
import * as PropTypes from 'prop-types'

type HelloProps = {
  name: string
}

const Hello = ({ name }) => {
  return(
    <div>Hello, { name }!</div>
  )
}

export default Hello