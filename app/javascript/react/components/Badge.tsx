import React from 'react'

type BadgeProps = {
  text: string,
  color: 'green' | 'red'
}

export const Badge = ({
  text,
  color
}: BadgeProps) => {
  return(
    <span
      className={`w-min bg-${color}-100 text-${color}-600 rounded-full text-sm font-medium px-3 py-1`}
    >
      {text}
    </span>
  )
}
