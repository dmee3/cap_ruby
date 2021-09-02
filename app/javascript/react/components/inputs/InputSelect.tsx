import React from 'react'

type InputSelectProps = {
  autofocus: false,
  id: string,
  name: string,
  placeholder?: string,
  value: string
}
type InputSelectState = {
  value: string
}

class InputSelect extends React.Component<InputSelectProps, InputSelectState> {
  handleChange(event) {
    this.setState({ value: event.target.value })
  }

  render() {
    return (
      <input
        autoFocus={this.props.autofocus}
        placeholder={this.props.placeholder}
        className="input-text"
        type="text"
        name={this.props.name}
        id={this.props.id}
        value={this.state.value}
        onChange={this.handleChange}
      />
    )
  }
}

export default InputSelect