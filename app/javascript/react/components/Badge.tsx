import React from 'react'

type BadgeProps = {
  text: string,
  color: 'green' | 'red'
}

class Badge extends React.Component<BadgeProps> {
  render() {
    return(
      <span
        className={`w-min bg-${this.props.color}-100 text-${this.props.color}-600 rounded-full text-sm font-medium px-3 py-1`}
      >
        {this.props.text}
      </span>
    )
  }
}

export default Badge
