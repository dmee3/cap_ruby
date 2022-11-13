import React from 'react'
import { render } from 'react-dom'
import RhythmConverter from '../../react/widgets/rhythm/RhythmConverter'

const Rhythm = () => {
  render(
    <RhythmConverter />,
    document.getElementById('root')
  )
  }

Rhythm()
